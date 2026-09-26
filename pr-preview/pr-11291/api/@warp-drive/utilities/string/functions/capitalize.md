---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11291/api/@warp-drive/utilities/string/functions/capitalize.md
---

# &#x20;capitalize()&#x20;

```ts
function capitalize(str: string): string;
```

Defined in: [-private/string/transform.ts:99](https://github.com/warp-drive-data/warp-drive/blob/aed3f52874c34501c8eb0b5a5a50cc1fceaf02b9/warp-drive-packages/utilities/src/-private/string/transform.ts#L99)

Returns the Capitalized form of a string

```js
import { capitalize } from '@warp-drive/utilities/string';

capitalize('innerHTML')                 // 'InnerHTML'
capitalize('action_name')               // 'Action_name'
capitalize('css-class-name')            // 'Css-class-name'
capitalize('my favorite items')         // 'My favorite items'
capitalize('privateDocs/ownerInvoice'); // 'PrivateDocs/ownerInvoice'
```

## Parameters

### str

`string`

## Returns

`string`
