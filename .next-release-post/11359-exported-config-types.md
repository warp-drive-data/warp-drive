---
releases: ["5.10"]
---
Several types that appear in `@warp-drive/utilities` signatures can now be imported by name
instead of being recovered with `Parameters<>` or `ReturnType<>`: `CompressionOptions` and
`Constraints` (taken by `AutoCompress`) from `@warp-drive/utilities/handlers`, and
`JSONAPIConfig` (taken by `setBuildURLConfig`) and `JsonApiResourcePatch` (returned by
`serializePatch`) from `@warp-drive/utilities/json-api`.
