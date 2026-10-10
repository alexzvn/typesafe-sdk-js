import { describe, expect, it } from "vitest";
import {
  audio,
  fromBlob,
  image,
  imagePart,
  TypeSafeError,
  toBase64,
  toDataURL,
  video,
} from "../src";

const sample = (length: number): Uint8Array =>
  Uint8Array.from({ length }, (_, i) => (i * 31 + 7) % 256);

describe("toBase64", () => {
  const bytes = sample(0x8000 * 2 + 5);
  const view = bytes.subarray(3, bytes.length - 2);
  const expected = Buffer.from(view).toString("base64");

  it("encodes views at their offset, from ArrayBuffer, and across chunk boundaries", () => {
    expect(toBase64(view)).toBe(expected);
    expect(toBase64(new DataView(bytes.buffer, 3, view.length))).toBe(expected);
    expect(toBase64(bytes.slice(3, bytes.length - 2).buffer)).toBe(expected);
    expect(toBase64(new Uint8Array())).toBe("");
  });

  it("matches without Buffer, through the btoa fallback", () => {
    const runtime: { Buffer?: typeof Buffer } = globalThis;
    const saved = runtime.Buffer;
    runtime.Buffer = undefined;
    try {
      expect(toBase64(view)).toBe(expected);
    } finally {
      runtime.Buffer = saved;
    }
  });

  it("prefers the native Uint8Array encoder over the view's bytes when present", () => {
    const proto = Uint8Array.prototype;
    const saved = Object.getOwnPropertyDescriptor(proto, "toBase64");
    const seen: number[] = [];
    Object.defineProperty(proto, "toBase64", {
      configurable: true,
      value(this: Uint8Array) {
        seen.push(this.byteOffset, this.byteLength);
        return "native";
      },
    });
    try {
      expect(toBase64(view)).toBe("native");
      expect(seen).toEqual([view.byteOffset, view.byteLength]);
    } finally {
      if (saved) Object.defineProperty(proto, "toBase64", saved);
      else Reflect.deleteProperty(proto, "toBase64");
    }
  });
});

describe("media encoders", () => {
  it("build data URLs of the requested kind", () => {
    const bytes = new Uint8Array([1, 2, 3]);
    expect(image(bytes, "image/png")).toBe("data:image/png;base64,AQID");
    expect(audio(bytes, "audio/mpeg")).toBe("data:audio/mpeg;base64,AQID");
    expect(video(bytes, "video/mp4")).toBe("data:video/mp4;base64,AQID");
  });

  it("reject a content type of another kind from untyped callers", () => {
    const untyped: string = "video/mp4";
    expect(() => image(new Uint8Array(), untyped as `image/${string}`)).toThrow(TypeSafeError);
  });

  it("fromBlob uses the blob's type and checks its kind", async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm;codecs=opus" });
    await expect(fromBlob(blob, "audio")).resolves.toBe("data:audio/webm;codecs=opus;base64,AQID");
    await expect(fromBlob(blob, "image")).rejects.toThrow("image/*");
    await expect(fromBlob(new Blob([new Uint8Array([1])]), "image")).rejects.toThrow(
      "no media type",
    );
  });

  it("fromBlob accepts any object with a type and arrayBuffer()", async () => {
    const file = { type: "image/png", arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer };
    await expect(fromBlob(file, "image")).resolves.toBe("data:image/png;base64,AQID");
  });

  it("toDataURL and imagePart normalize the object form", () => {
    const media = { content_type: "image/jpeg", base64: "AQID" } as const;
    expect(toDataURL(media)).toBe("data:image/jpeg;base64,AQID");
    expect(toDataURL("data:image/png;base64,AA")).toBe("data:image/png;base64,AA");
    expect(imagePart(media)).toEqual({
      type: "image_url",
      image_url: { url: "data:image/jpeg;base64,AQID" },
    });
  });
});
