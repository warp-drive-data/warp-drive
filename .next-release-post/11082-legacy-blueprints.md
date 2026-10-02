---
releases: ["5.10"]
---
The ember-cli blueprints work again. `@warp-drive/legacy` ships `model`, `adapter`, `serializer`
and `transform` blueprints with their tests, generating imports from `@warp-drive/legacy/*`, and
the `ember-data`, `@ember-data/model`, `@ember-data/adapter` and `@ember-data/serializer` packages
now delegate to them. `ember g model post title:string` in an app using `ember-data` writes the
model file again rather than only its test, and generated files no longer contain HTML-escaped
quotes. Apps using `ember-data` get `@ember-data/*` imports, and `ember g model --help` prints the
detailed help only from `@warp-drive/legacy`.
