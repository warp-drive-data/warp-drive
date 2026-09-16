---
url: /api/@warp-drive/core/types/runtime/functions/setIsMaybeMirage.md
---

# &#x20;setIsMaybeMirage()

```ts
function setIsMaybeMirage(value: boolean): void;
```

Defined in: [warp-drive-packages/core/src/types/runtime.ts:82](https://github.com/warp-drive-data/warp-drive/blob/8469e17a196969acc93511c466120ba3296f8da7/warp-drive-packages/core/src/types/runtime.ts#L82)

Explicitly declares whether requests may be served by Mirage (or another
Pretender-based fetch mock) instead of a native `fetch` implementation.

The `Fetch` request handler otherwise infers this via a heuristic (the
presence of `window.server.pretender`, or `window.fetch` appearing to be
patched), which can be wrong in either direction: some Mirage setups don't
expose `window.server`, while some unrelated tools (APM agents, browser
extensions) also patch `fetch`. Call this to override that heuristic:
`true` to force Mirage-compatible behavior on, `false` to force it off.

globalThis.setWarpDriveIsMaybeMirage(true);

## Parameters

### value

`boolean`

## Returns

`void`
