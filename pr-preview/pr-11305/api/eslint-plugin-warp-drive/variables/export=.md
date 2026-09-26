---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11305/api/eslint-plugin-warp-drive/variables/export=.md
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

Defined in: [index.js:12](https://github.com/warp-drive-data/warp-drive/blob/9aac0cccca5b7489c38352b1f0d67d77818a333a/packages/eslint-plugin-warp-drive/src/index.js#L12)

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
