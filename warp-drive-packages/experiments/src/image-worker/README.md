<p align="center">
  <img
    class="project-logo"
    src="../../logos/warp-drive-logo-dark.svg#gh-light-mode-only"
    alt="WarpDrive"
    width="200px"
    title="WarpDrive" />
  <img
    class="project-logo"
    src="../../logos/warp-drive-logo-gold.svg#gh-dark-mode-only"
    alt="WarpDrive"
    width="200px"
    title="WarpDrive" />
</p>

<h3 align="center">ImageWorker</h3>

- Fetches images from a `Worker`/`SharedWorker` instead of the main thread
- Dedupes concurrent fetches for the same url within the worker
- Shares fetched-image state cross-tab when using a `SharedWorker`

## Install

```sh
pnpm add @warp-drive/experiments
```

Or use your favorite javascript package manager.

## About

`ImageWorker` offloads image fetching to a dedicated `Worker` or `SharedWorker`.
The worker downloads each requested url via `fetch` (letting the browser's
normal HTTP cache do its job) and dedupes concurrent requests for the same url,
so multiple tabs/windows sharing a `SharedWorker` never fetch the same image
twice at once.

`ImageFetch` is the main-thread client used to talk to an `ImageWorker`.
Construct it with your `Worker`/`SharedWorker` instance and call `load(url)`
to ask the worker to fetch that url.

## Known Limitations

This is an early experiment; the following gaps exist today:

- `ImageFetch.load(url)` resolves with the original `url`, not an object url.
  The worker does convert the fetched image into a `Blob` and create an object
  url for it internally, but that object url is not currently surfaced back to
  the caller — `load` is only useful today as a way to pre-warm a url through
  the worker's fetch/dedupe logic, not to obtain a blob url for the image.
- Calling `load` again for the same url while a prior call for that same url
  is still in-flight on the same `ImageFetch` instance replaces the pending
  request rather than joining it; only the most recently issued call resolves,
  and the earlier call's promise never settles.
- If the underlying `fetch` in the worker rejects, no response is sent back to
  the requesting thread, so `load`'s returned promise hangs indefinitely
  instead of rejecting.
- `SharedWorker` is the intended target. A plain `Worker` is only accepted
  when running in a `TESTING` build; using one outside of tests will fail an
  assertion.
- `ImageWorker`'s `persisted` constructor option is accepted but not yet
  implemented.

## Configure

### Step 1. Create The Worker

```ts
// app/workers/image-worker.ts
import { ImageWorker } from '@warp-drive/experiments/image-worker';

new ImageWorker();
```

### Step 2. Use It From Your Application

```ts
import { ImageFetch } from '@warp-drive/experiments/image-fetch';

const worker = new SharedWorker(new URL('./workers/image-worker.ts', import.meta.url));
const images = new ImageFetch(worker);

await images.load('https://example.com/cat.png');
```

> [!TIP]
> SharedWorker and Worker are both supported; however, SharedWorker is preferred.
> Worker is only usable in test environments.

#### Usage in SSR

In SSR, `ImageFetch` deactivates itself and resolves `load` with the given url
immediately. When in SSR mode, the worker argument is allowed to be `null` to
support guarding its creation.

```ts
const worker = isFastBoot ? null : new SharedWorker(new URL('./workers/image-worker.ts', import.meta.url));
const images = new ImageFetch(worker);
```

#### Usage in Tests

In tests, it's often best to use a `Worker` instead of a `SharedWorker`.

```ts
const worker = macroCondition(isTesting())
  ? new Worker(new URL('./workers/image-worker.ts', import.meta.url))
  : new SharedWorker(new URL('./workers/image-worker.ts', import.meta.url));

const images = new ImageFetch(worker);
```
