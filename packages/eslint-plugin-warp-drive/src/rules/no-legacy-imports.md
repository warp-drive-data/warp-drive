| Rule | 🏷️ | ✨ |
| ---- | -- | -- |
| `no-legacy-imports` | 🏆 | ✅ |

> [!NOTE]
> Rewrites imports written against an older EmberData or WarpDrive release to the modules that
> hold the same exports in this plugin's release. Imports that cannot be rewritten safely are
> reported without a fix. The rule decides from a map that ships with the plugin. It records
> where every export of each older release lives in this release, and which legacy modules
> moved as a whole.

> [!TIP]
> This rule is autofixable. A fix can split one import declaration into several when its names
> moved to different modules. Review these splits in the diff.

## Examples

Before:

```js
import Store from '@ember-data/store';
import Model, { attr, hasMany } from '@ember-data/model';
import Adapter from '@ember-data/adapter/rest';
import { findRecord, Unknown } from '@ember-data/rest/request';
import * as compat from '@ember-data/legacy-compat';
```

After:

```js
import { Store } from '@warp-drive/core';
import Model, { attr, hasMany } from '@warp-drive/legacy/model';
import { RESTAdapter as Adapter } from '@warp-drive/legacy/adapter/rest';
import { findRecord } from '@warp-drive/utilities/rest';
import { Unknown } from '@ember-data/rest/request';
import * as compat from '@warp-drive/legacy/compat';
```

`Unknown` is also reported, because `@ember-data/rest/request` never exported it.

## Options

```js
rules: {
  'warp-drive/no-legacy-imports': ['error', { from: '5.7' }],
}
```

`from` is the release your imports were written against, as a `major.minor` string. The rule
uses the map from that release to this plugin's release. The allowed values are every minor
release from `5.5` up to the one before this plugin's release. The default is `5.5`. Any other
value fails config validation.

Pick the release your app was on before the upgrade. The same module path can mean different
things in different releases. For example, with `from: '5.7'` the rule rewrites
`getRequestState` from `@warp-drive/core/store/-private` to `@warp-drive/ember`.

## What the rule does with each imported name

The rule looks at every default, named and namespace specifier of a static
`import ... from '...'` declaration. For each name it does one of four things.

- **Rewrite.** The name has a home in a current module. The fix imports it from there. It
  keeps your local binding name. When the export was renamed, or a default export became a named
  one, the fix imports the new name under your old local name, as `RESTAdapter as Adapter` shows
  above. `import type` and inline `type` specifiers stay type-only. When every name in a
  rewritten declaration is a type, the fix writes `import type`.
- **Report, no replacement** (`warp-drive.no-legacy-imports.unmapped-export`). The name no
  longer exists in this release, or the module never exported it. The import is left as written
  and needs manual migration.
- **Report, legacy home** (`warp-drive.no-legacy-imports.legacy-home`). The name still lives only
  in a legacy package, for example the default export of `ember-data/version`. There is no modern
  module to rewrite to yet, so the import is left as written.
- **Report, type-only target** (`warp-drive.no-legacy-imports.type-only-target`). A value import
  names something that was a value in the `from` release and is only a type in this release, for
  example `import { ManyArray } from '@ember-data/model/-private'`. Rewriting it would import a
  name with no runtime value, so the import is left as written. Use `import type` if the name is
  only used as a type, and the rule then rewrites it. Otherwise it needs manual migration.

A declaration with any rewrite gets one `warp-drive.no-legacy-imports` report that carries the
fix. Names that stay behind keep a declaration from the original module, and their own reports
are listed separately.

## Names the `from` release did not export

A legacy module that forwards everything through a single `export *` moved as a whole. A name
the map does not list, such as one added after the `from` release, follows that move with its
name unchanged. `import { TotallyNew } from '@ember-data/request'` becomes an import from
`@warp-drive/core/request`.

A legacy module that lists its exports one by one did not move as a whole. A name from it that
the map does not list is reported as having no replacement.

## Namespace imports

`import * as compat from '@ember-data/legacy-compat'` follows the module's move when the whole
module moved, as above. A namespace import from a module that did not move as a whole, such as
`import * as store from '@ember-data/store'`, is left as written and is not reported.

## What the rule ignores

- Imports from modules the map does not know, such as third-party packages. A module counts as
  known when the `from` release exported anything from it.
- Imports from a known module whose export stayed in place.
- Side-effect imports, such as `import '@ember-data/store'`.
- Re-exports, such as `export { attr } from '@ember-data/model'` and `export * from '...'`.
- Dynamic `import()` and CommonJS `require()`.

The fix does not merge a rewritten import into an existing import of the same module.
