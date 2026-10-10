# Changelog

## Unreleased

### Features

- add `images`, `audio`, and `videos` to `SystemOneRequest`, typed as base64 data URLs or `{ content_type, base64 }` objects of the matching media kind (`ImageInput`, `AudioInput`, `VideoInput`)
- add the `defaultPath` client option to send `systemOne` to servers that do not use `/v1/systemone`
- add media helpers: `image`, `audio`, and `video` encode bytes as data URLs, `fromBlob` encodes a `Blob` or `File` by its own type, `toDataURL` converts `{ content_type, base64 }` to a data URL, `imagePart` builds an `image_url` part for `state` arrays, and `toBase64` encodes bytes in any runtime

## v0.6.0 (2026-09-15)

### Breaking changes

- accept `Score.criteria` as an ordered sequence instead of a dictionary keyed by integers

## v0.5.7 (2026-09-11)

This is the initial public release of TypeSafe JavaScript and TypeScript SDK. Learn more in the [documentation](https://docs.typesafe.ai/sdk/javascript).
