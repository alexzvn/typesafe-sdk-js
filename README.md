# SystemOne — TypeSafe AI JavaScript SDK

JavaScript and TypeScript SDK for [TypeSafe AI](https://typesafe.ai), published as `@alexzvn/systemone`.

> Fork of the official [`@typesafe-ai/sdk`](https://github.com/typesafe-ai/typesafe-sdk-js) by TypeSafe and its contributors (evinism, Allie Laabs). Original copyright and MIT license retained.

## Quickstart

Install the SDK (Node.js 20 or newer):

```sh
npm install @alexzvn/systemone
```

Set `TYPESAFE_API_KEY` in your environment, then create and use the client:

```ts
import { choice, TypeSafeClient } from "@alexzvn/systemone";

const client = new TypeSafeClient();
const response = await client.systemOne({
  state: { document: "I was charged twice. Please fix this ASAP." },
  questions: {
    category: choice("What is this ticket about?", {
      billing: null,
      technical: null,
      other: null,
    }),
  },
});

console.log(response.answers.category.choice);
```

Answer types are inferred from your questions. The package includes ESM, CommonJS, and TypeScript declarations.

## Images, audio, and video

`systemOne` accepts `images`, `audio`, and `videos` arrays, shared by every question. Each item is a base64 data URL (`data:image/png;base64,...`) or `{ content_type, base64 }`. Remote URLs are not accepted. Which modalities, how many items, and what sizes work depends on the model and server.

```ts
import { readFile } from "node:fs/promises";
import { choice, fromBlob, image, TypeSafeClient } from "@alexzvn/systemone";

const client = new TypeSafeClient();
const response = await client.systemOne({
  state: "Customer-submitted receipt",
  images: [image(await readFile("receipt.png"), "image/png")],
  questions: {
    legible: choice("Is the receipt legible?", { yes: null, no: null }),
  },
});

// In browsers, encode a File or Blob using its own media type:
const photo = await fromBlob(fileInput.files[0], "image");
```

Helpers:

| Helper | Purpose |
| --- | --- |
| `image(bytes, type)`, `audio(bytes, type)`, `video(bytes, type)` | Encode an `ArrayBuffer` or typed array (including a Node `Buffer`) as a data URL; throws if `type` doesn't match the kind |
| `fromBlob(blob, kind)` | Encode a `Blob`/`File` using its own `type` |
| `toDataURL(media)` | Convert `{ content_type, base64 }` to a data URL |
| `imagePart(media)` | Wrap an image as an OpenAI-style `image_url` part, for servers that read images from a `state` array |
| `toBase64(bytes)` | Encode bytes as base64 |

## Custom inference path

For servers that don't serve `/v1/systemone`, set `defaultPath`. It must start with `/`.

```ts
const client = new TypeSafeClient({
  baseURL: "http://localhost:8080",
  defaultPath: "/v1/evaluate",
});
```

## Documentation

Learn what TypeSafe can do in the [TypeSafe docs](https://docs.typesafe.ai/).
See the SDK's [client](src/client.ts) and [types](src/types.ts) for API options and defaults.
