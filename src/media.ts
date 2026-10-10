import { TypeSafeError } from "./errors";
import type {
  BinaryData,
  BlobLike,
  DataURL,
  ImageInput,
  ImagePart,
  MediaInput,
  MediaKind,
} from "./types";

interface Base64Globals {
  Buffer?: {
    from(
      buffer: ArrayBufferLike,
      offset: number,
      length: number,
    ): { toString(encoding: "base64"): string };
  };
}

const g = globalThis as Base64Globals;
const CHUNK = 0x8000;

const bytesOf = (data: BinaryData): Uint8Array =>
  ArrayBuffer.isView(data)
    ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
    : new Uint8Array(data);

/** Encode bytes as base64 without copying views, using native encoders when available. */
export const toBase64 = (data: BinaryData): string => {
  const bytes = bytesOf(data);
  if ("toBase64" in bytes && typeof bytes.toBase64 === "function") return bytes.toBase64();
  if (g.Buffer) {
    return g.Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString("base64");
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK) as unknown as number[]);
  }
  return btoa(binary);
};

const encode = <K extends MediaKind>(
  kind: K,
  data: BinaryData,
  contentType: `${K}/${string}`,
): DataURL<K> => {
  if (typeof contentType !== "string" || !contentType.startsWith(`${kind}/`)) {
    throw new TypeSafeError(
      `Expected a ${kind}/* content type, got ${JSON.stringify(contentType)}.`,
    );
  }
  return `data:${contentType};base64,${toBase64(data)}` as DataURL<K>;
};

/** Encode image bytes as a data URL, e.g. `image(await readFile("a.png"), "image/png")`. */
export const image = (data: BinaryData, contentType: `image/${string}`): DataURL<"image"> =>
  encode("image", data, contentType);

/** Encode audio bytes as a data URL, e.g. `audio(bytes, "audio/mpeg")`. */
export const audio = (data: BinaryData, contentType: `audio/${string}`): DataURL<"audio"> =>
  encode("audio", data, contentType);

/** Encode video bytes as a data URL, e.g. `video(bytes, "video/mp4")`. */
export const video = (data: BinaryData, contentType: `video/${string}`): DataURL<"video"> =>
  encode("video", data, contentType);

/**
 * Encode a `Blob`, `File`, or any object with `type` and `arrayBuffer()` as a data URL using its
 * own media type, which must match `kind`.
 *
 * @throws {TypeSafeError} The blob has no media type, or its type is not of `kind`.
 */
export const fromBlob = async <K extends MediaKind>(
  blob: BlobLike,
  kind: K,
): Promise<DataURL<K>> => {
  if (!blob.type) {
    throw new TypeSafeError(
      `The blob has no media type; pass its bytes to \`${kind}()\` with a content type.`,
    );
  }
  return encode(kind, await blob.arrayBuffer(), blob.type as `${K}/${string}`);
};

/** Convert either media form to a data URL, the form every multimodal server accepts. */
export const toDataURL = <K extends MediaKind>(media: MediaInput<K>): DataURL<K> =>
  typeof media === "string"
    ? media
    : (`data:${media.content_type};base64,${media.base64}` as DataURL<K>);

/** Wrap an image as an OpenAI-style `image_url` part for `state` arrays or chat messages. */
export const imagePart = (media: ImageInput): ImagePart => ({
  type: "image_url",
  image_url: { url: toDataURL(media) },
});
