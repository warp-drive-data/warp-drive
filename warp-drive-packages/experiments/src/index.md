# @warp-drive/experiments

:::danger ⚠️ Experimental
Everything in this package is pre-RFC and may change or be removed without a major version bump.
See the [Experiments guide](/guides/the-manual/experiments/) before depending on any of it.
:::

Experiments that may or may not make it into the project core. Each one is its own entry point:

- [`data-worker`](/api/@warp-drive/experiments/data-worker/): run fetch and persisted-cache logic
  in a `Worker`, deduping requests across tabs and windows.
- [`worker-fetch`](/api/@warp-drive/experiments/worker-fetch/): the handler an app installs to
  hand its requests to a `DataWorker`.
- [`document-storage`](/api/@warp-drive/experiments/document-storage/): an alternative to
  IndexedDB built over the StorageManager API.
- [`image-worker`](/api/@warp-drive/experiments/image-worker/) and
  [`image-fetch`](/api/@warp-drive/experiments/image-fetch/): fetch, cache and dedupe images from
  a `Worker`/`SharedWorker` instead of the main thread.
- [`storage`](/api/@warp-drive/experiments/storage/): reactive storage resources backed by
  `localStorage`/`sessionStorage`.
- [`pagination`](/api/@warp-drive/experiments/pagination/): reactive pagination primitives.
