# @warp-drive/vue

Components and utilities for working with ***Warp*Drive** requests in Vue: reactive primitives
that let you build robust, performant apps with elegant control flow.

```vue
<script setup>
  import { Request } from '@warp-drive/vue';
  import { store } from './app/store';
</script>

<Request>
</Request>
```

The [Setup guide](/guides/configuration/) covers configuring a Store; the
[`install`](/api/@warp-drive/vue/install/) entry point wires ***Warp*Drive**'s reactivity to Vue's.
