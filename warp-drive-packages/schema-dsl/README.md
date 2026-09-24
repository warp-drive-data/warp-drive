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

### ♥️ Credits

 <details>
   <summary>Brought to you with ♥️ love by <a href="https://emberjs.com" title="EmberJS">🐹 Ember</a></summary>

  <style type="text/css">
    img.project-logo {
       padding: 0 5em 1em 5em;
       width: 100px;
       border-bottom: 2px solid #bbb;
       margin: 0 auto;
       display: block;
     }
    details > summary {
      font-size: 1.1rem;
      line-height: 1rem;
      margin-bottom: 1rem;
    }
    details {
      font-size: 1rem;
    }
    details > summary strong {
      display: inline-block;
      padding: .2rem 0;
      color: #000;
      border-bottom: 3px solid #bbb;
    }

    details > details {
      margin-left: 2rem;
    }
    details > details > summary {
      font-size: 1rem;
      line-height: 1rem;
      margin-bottom: 1rem;
    }
    details > details > summary strong {
      display: inline-block;
      padding: .2rem 0;
      color: #555;
      border-bottom: 2px solid #555;
    }
    details > details {
      font-size: .85rem;
    }

    @media (prefers-color-scheme: dark) {
      details > summary strong {
        color: #fff;
      }
    }
    @media (prefers-color-scheme: dark) {
      details > details > summary strong {
        color: #afaba0;
      border-bottom: 2px solid #afaba0;
      }
    }
  </style>
</details>
