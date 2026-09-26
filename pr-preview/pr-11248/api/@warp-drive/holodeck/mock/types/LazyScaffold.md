---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11248/api/@warp-drive/holodeck/mock/types/LazyScaffold.md
---

# &#x20;LazyScaffold

```ts
interface LazyScaffold {
  method: string;
  scaffold: () => Scaffold;
  url: string;
}
```

Defined in: [mock.ts:29](https://github.com/warp-drive-data/warp-drive/blob/f062a076bc8863498969a21610d42251c8546673/packages/holodeck/src/mock.ts#L29)

A mock whose method and url are known up front, with the rest of the
scaffold built only when holodeck is recording. This is what the mock
helpers pass, so that in replay mode a test's response generators never
run.

## Properties

### method

```ts
method: string;
```

Defined in: [mock.ts:30](https://github.com/warp-drive-data/warp-drive/blob/f062a076bc8863498969a21610d42251c8546673/packages/holodeck/src/mock.ts#L30)

***

### scaffold

```ts
scaffold: () => Scaffold;
```

Defined in: [mock.ts:32](https://github.com/warp-drive-data/warp-drive/blob/f062a076bc8863498969a21610d42251c8546673/packages/holodeck/src/mock.ts#L32)

#### Returns

[`Scaffold`](Scaffold.md)

***

### url

```ts
url: string;
```

Defined in: [mock.ts:31](https://github.com/warp-drive-data/warp-drive/blob/f062a076bc8863498969a21610d42251c8546673/packages/holodeck/src/mock.ts#L31)
