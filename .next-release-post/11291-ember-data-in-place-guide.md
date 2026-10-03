---
releases: ["5.10"]
---
A new upgrade guide replaces `ember-data` 4.12 with the `@warp-drive/*` packages in one change,
keeping the single store and the Models, adapters and serializers an app already has. It swaps the
packages, sets `compatWith: '4.12'` so every later deprecation stays supported, builds the app's
own store service with `useLegacyStore({ legacyRequests: true })`, and rewrites the imports with
the `no-legacy-imports` lint rule, leaving schemas and request builders as follow-up work. See
[Replacing ember-data in place](/upgrading/ember-data/in-place.md).
