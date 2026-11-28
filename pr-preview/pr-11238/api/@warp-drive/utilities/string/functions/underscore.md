---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11238/api/@warp-drive/utilities/string/functions/underscore.md
description: >-
  Converts camelCase, dashed, or spaced strings to lowercase snake_case, such as
  `innerHTML` to `inner_html`.
---

# &#x20;underscore()&#x20;

```ts
function underscore(str: string): string;
```

Defined in: [-private/string/transform.ts:83](https://github.com/warp-drive-data/warp-drive/blob/16266e84cb8f768b9368b912524789ccbce1d3b1/warp-drive-packages/utilities/src/-private/string/transform.ts#L83)

Returns the lower_case_and_underscored form of a string.

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
