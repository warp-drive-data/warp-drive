---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/ember/install/functions/buildSignalConfig.md
---

# &#x20;buildSignalConfig()

```ts
function buildSignalConfig(options): SignalHooks<Tag | [Tag, Tag, Tag]>;
```

Defined in: [warp-drive-packages/ember/dist/install.d.ts:12](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/ember/dist/install.d.ts#L12)

Builds the [SignalHooks](../../../core/configure/interfaces/SignalHooks.md) implementation backed by Ember's
`@glimmer/validator` tags, used to wire WarpDrive's reactivity
primitives into Ember's autotracking system.

## Parameters

### options

#### wellknown

{
`Array`: `string` | `symbol`;
}

#### wellknown.Array

`string` | `symbol`

## Returns

[`SignalHooks`](../../../core/configure/interfaces/SignalHooks.md)<`Tag` | \[`Tag`, `Tag`, `Tag`]>
