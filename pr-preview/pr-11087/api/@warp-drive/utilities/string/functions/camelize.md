---
url: /pr-preview/pr-11087/api/@warp-drive/utilities/string/functions/camelize.md
---

# &#x20;camelize()&#x20;

```ts
function camelize(str): string;
```

Defined in: [-private/string/transform.ts:59](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/utilities/src/-private/string/transform.ts#L59)

Returns the lowerCamelCase form of a string.

```js
import { camelize } from '@warp-drive/utilities/string';

camelize('innerHTML');                   // 'innerHTML'
camelize('action_name');                 // 'actionName'
camelize('css-class-name');              // 'cssClassName'
camelize('my favorite items');           // 'myFavoriteItems'
camelize('My Favorite Items');           // 'myFavoriteItems'
camelize('private-docs/owner-invoice');  // 'privateDocs/ownerInvoice'
```

## Parameters

### str

`string`

## Returns

`string`
