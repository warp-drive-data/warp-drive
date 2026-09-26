---
url: https://canary.warp-drive.io/api/eslint-plugin-warp-drive/variables/export=.md
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

Defined in: [index.js:12](https://github.com/warp-drive-data/warp-drive/blob/03dcb5d183725315ce1f5cc5933667e6e64ba5c3/packages/eslint-plugin-warp-drive/src/index.js#L12)

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
