---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11248/api/@warp-drive/core/reactive/types/ProcessedExtension.md
---

# &#x20;ProcessedExtension

```ts
interface ProcessedExtension {
  features: Map<string | symbol, ExtensionDef>;
  kind: "object" | "array";
  name: string;
}
```

Defined in: [warp-drive-packages/core/src/reactive/-private/schema.ts:239](https://github.com/warp-drive-data/warp-drive/blob/f062a076bc8863498969a21610d42251c8546673/warp-drive-packages/core/src/reactive/-private/schema.ts#L239)

The result of processExtension normalizing a
[CAUTION\_MEGA\_DANGER\_ZONE\_Extension](CAUTION_MEGA_DANGER_ZONE_Extension.md) into a lookup of its features
by name.

## Properties

### features

```ts
features: Map<string | symbol, ExtensionDef>;
```

Defined in: [warp-drive-packages/core/src/reactive/-private/schema.ts:245](https://github.com/warp-drive-data/warp-drive/blob/f062a076bc8863498969a21610d42251c8546673/warp-drive-packages/core/src/reactive/-private/schema.ts#L245)

Each feature the extension exposes, keyed by its property name.

***

### kind

```ts
kind: "object" | "array";
```

Defined in: [warp-drive-packages/core/src/reactive/-private/schema.ts:241](https://github.com/warp-drive-data/warp-drive/blob/f062a076bc8863498969a21610d42251c8546673/warp-drive-packages/core/src/reactive/-private/schema.ts#L241)

Whether this extension applies to objects/resources or to arrays.

***

### name

```ts
name: string;
```

Defined in: [warp-drive-packages/core/src/reactive/-private/schema.ts:243](https://github.com/warp-drive-data/warp-drive/blob/f062a076bc8863498969a21610d42251c8546673/warp-drive-packages/core/src/reactive/-private/schema.ts#L243)

The name the extension was registered under.
