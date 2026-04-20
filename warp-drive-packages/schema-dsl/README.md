# @warp-drive/schema-dsl

TypeScript DSL for defining WarpDrive schemas using decorators.

Schemas are compiled at build time via a Vite plugin — the decorator classes
are only used for authoring and never ship to the browser.

## Usage

Define your schemas:

```ts
// app/schemas/user.ts
import { Resource, field, id } from '@warp-drive/schema-dsl';

@Resource
class User {
  @field declare firstName: string;
  @field declare lastName: string;
  @field declare email: string;
}
```

Add the Vite plugin:

```ts
// vite.config.ts
import { schemaDSL } from '@warp-drive/schema-dsl/vite';

export default defineConfig({
  plugins: [
    schemaDSL({
      schemas: 'app/schemas/**/*.ts',
    }),
    // ...other plugins
  ],
});
```

Import and register the compiled schemas:

```ts
import schemas from 'virtual:warp-drive-schemas';
import { registerDerivations } from '@warp-drive/core/reactive';

registerDerivations(store.schema);
store.schema.registerResources(schemas);
```

See the [Schema DSL Guide](https://warp-drive.io/guide/schemas/dsl) for full documentation.
