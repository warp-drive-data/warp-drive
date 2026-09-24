# Schema migration codemod

Source for the `migrate-to-schema` codemod. User-facing usage, configuration, generated output,
and caveats live in the [Using Codemods](https://warp-drive.io/upgrading/v5/codemods) guide.
Keep that guide, not this file, in sync with behavior changes.

## Layout

- `tasks/migrate.ts` exports `runMigration`, the entry point the CLI calls from `src/cli/apply.ts`. It hands each discovered file to a processor and writes the artifacts.
- `codemod.ts` holds the `Codemod` class that finds model and mixin files and analyzes mixin usage before processing.
- `processors/model.ts` turns a Model into a schema, type, and extension file.
- `processors/mixin.ts` and `processors/mixin-analyzer.ts` turn a Mixin into a trait schema, type, and extension file.
- `utils/` holds the AST helpers (via [ast-grep](https://ast-grep.github.io/)), import resolution, and code generation shared by both processors.
- `config.ts` defines the config file shape; `config-schema.json` is its JSON schema and `example.config.json` a sample.

Tests live in `tests/codemods` at the repo root.
