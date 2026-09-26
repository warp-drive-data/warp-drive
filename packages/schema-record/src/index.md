# @warp-drive/schema-record

This package declares nothing of its own. Its single entry point re-exports the
reactive-resource API from {@link @warp-drive/core!reactive | @warp-drive/core/reactive}
so existing `@warp-drive/schema-record` imports keep working:

| `@warp-drive/schema-record` export | `@warp-drive/core/reactive` source                                           |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| `instantiateRecord`                | {@link @warp-drive/core!reactive.instantiateRecord instantiateRecord}        |
| `teardownRecord`                   | {@link @warp-drive/core!reactive.teardownRecord teardownRecord}              |
| `SchemaService`                    | {@link @warp-drive/core!reactive.SchemaService SchemaService}                |
| `withDefaults`                     | {@link @warp-drive/core!reactive.withDefaults withDefaults}                  |
| `fromIdentity`                     | {@link @warp-drive/core!reactive.fromIdentity fromIdentity}                  |
| `registerDerivations`              | {@link @warp-drive/core!reactive.registerDerivations registerDerivations}    |
| `Checkout`                         | {@link @warp-drive/core!reactive.Checkout Checkout}                          |
| `Transformation` (type)            | {@link @warp-drive/core!reactive.Transformation Transformation}              |
| `SchemaRecord` (type)              | {@link @warp-drive/core!reactive.ReactiveResource ReactiveResource}, renamed |

New code should import these from `@warp-drive/core/reactive` directly.
