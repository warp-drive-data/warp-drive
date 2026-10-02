---
releases: ["5.9"]
---
The `warp-drive` CLI adds `warp-drive generate <type> <name>` (aliases `g` and `gen`), which
writes a model, adapter, serializer or transform, or a unit test for one, without going through
ember-cli. `ember generate model` and the other `ember-data` blueprints keep working and now
produce the same output as the CLI. The blueprints no longer generate classic `Model.extend()`
syntax or pods layouts; they always write native classes at the default paths.

```sh
npx warp-drive generate model taco filling:belongs-to:protein toppings:has-many:topping name:string
```
