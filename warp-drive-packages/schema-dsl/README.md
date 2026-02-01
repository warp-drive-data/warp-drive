# @warp-drive/schema-dsl

TypeScript DSL for defining WarpDrive schemas using decorators.

## Usage

```ts
import { Resource, field, id, registerSchemas } from '@warp-drive/schema-dsl';

@Resource
class User {
  @field declare firstName: string;
  @field declare lastName: string;
  @field declare email: string;
}

@Resource
class Post {
  @id declare uuid: string;
  @field declare title: string;
  @field({ type: 'date-time' }) declare createdAt: Date;
}

// Register with your store
registerSchemas(store.schema, [User, Post]);
```

See the [Schema DSL Guide](https://warp-drive.io/guide/schemas/dsl) for full documentation.
