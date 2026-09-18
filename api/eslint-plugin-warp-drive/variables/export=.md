---
url: /api/eslint-plugin-warp-drive/variables/export=.md
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

Defined in: [index.js:10](https://github.com/warp-drive-data/warp-drive/blob/7afdd9818145634b9681a2bdd0f8c5cba16d9d9c/packages/eslint-plugin-warp-drive/src/index.js#L10)

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
