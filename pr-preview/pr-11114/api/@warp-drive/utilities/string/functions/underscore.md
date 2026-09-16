---
url: /pr-preview/pr-11114/api/@warp-drive/utilities/string/functions/underscore.md
---

# &#x20;underscore()&#x20;

```ts
function underscore(str): string;
```

Defined in: [-private/string/transform.ts:79](https://github.com/warp-drive-data/warp-drive/blob/2a894723a738725713417f2a39f20d1a3c698f73/warp-drive-packages/utilities/src/-private/string/transform.ts#L79)

Returns the lower\_case\_and\_underscored form of a string.

```js
import { underscore } from '@warp-drive/utilities/string';

underscore('innerHTML');                 // 'inner_html'
underscore('action_name');               // 'action_name'
underscore('css-class-name');            // 'css_class_name'
underscore('my favorite items');         // 'my_favorite_items'
underscore('privateDocs/ownerInvoice');  // 'private_docs/owner_invoice'
```

## Parameters

### str

`string`

## Returns

`string`
