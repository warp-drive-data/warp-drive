---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11266/api/eslint-plugin-warp-drive/variables/export=.md
---

# &#x20;export=

```ts
export=: {
  meta: {
     name: string;
     version: string;
  };
  rules: any;
};
```

Defined in: [index.js:10](https://github.com/warp-drive-data/warp-drive/blob/1a7c85f0c565d334929c0f2dd26023bb9bbcb6f7/packages/eslint-plugin-warp-drive/src/index.js#L10)

## Type Declaration

### meta

```ts
meta: {
  name: string;
  version: string;
};
```

#### meta.name

```ts
name: string = pkg.name;
```

#### meta.version

```ts
version: string = pkg.version;
```

### rules

```ts
rules: any;
```
