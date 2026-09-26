---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11256/api/@warp-drive/utilities/string/functions/camelize.md
---

# &#x20;camelize()&#x20;

```ts
function camelize(str: string): string;
```

Defined in: [-private/string/transform.ts:59](https://github.com/warp-drive-data/warp-drive/blob/eaabe67f41c439777a4aea3b876394f6f0c3bd02/warp-drive-packages/utilities/src/-private/string/transform.ts#L59)

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
