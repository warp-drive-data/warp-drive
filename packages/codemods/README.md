<p align="center">
  <img
    class="project-logo"
    src="./logos/logo-yellow-slab.svg"
    alt="WarpDrive"
    width="180px"
    title="WarpDrive"
    />
</p>

![NPM Stable Version](https://img.shields.io/npm/v/ember-data/latest?label=version&style=flat&color=fdb155)
![NPM Downloads](https://img.shields.io/npm/dm/ember-data.svg?style=flat&color=fdb155)
![License](https://img.shields.io/github/license/warp-drive-data/warp-drive.svg?style=flat&color=fdb155)
[![EmberJS Discord Community Server](https://img.shields.io/badge/EmberJS-grey?logo=discord&logoColor=fdb155)](https://discord.gg/zT3asNS
)
[![WarpDrive Discord Server](https://img.shields.io/badge/WarpDrive-grey?logo=discord&logoColor=fdb155)](https://discord.gg/PHBbnWJx5S
)

<p align="center">
  <br>
  <a href="https://warp-drive.io">WarpDrive</a> is the lightweight data library for web apps &mdash;
  <br>
  universal, typed, reactive, and ready to scale.
  <br/><br/>
</p>

---

# @ember-data/codemods

Codemods for WarpDrive/EmberData paradigms.

## Usage

### List all available codemods 
```
npx @ember-data/codemods apply --help
```

### List available CLI options for a given codemod
```
npx @ember-data/codemods apply migrate-to-schema --help
npx @ember-data/codemods apply legacy-compat-builders --help
```

### Run a codemod

```
npx @ember-data/codemods apply <codemod-name> [codemod-options] <target-glob-pattern...>
```

For example:

```
npx @ember-data/codemods apply legacy-compat-builders ./app/**/*.{js,ts}
```

## Codemods

### Available codemods

- [`legacy-compat-builders`](#legacy-compat-builders) - Migrates both EmberData models and mixins to WarpDrive schemas
- [`migrate-to-schema`](#migrate-to-schema) - Migrates both EmberData models and mixins to WarpDrive schemas

### migrate-to-schema

This codemod transforms EmberData models and mixins into WarpDrive's schema format, generating:
- **Schema files**: Define the data structure using `LegacyResourceSchema`
- **Extension files**: Preserve computed properties, methods, and other non-data logic
- **Trait files**: Reusable schema components from mixins

> [!NOTE]
> At this time the codemod is able to analyze Models and generate accurate WarpDrive structures.
> The codemod is under an active development and there're missing features and bugs are expected.
> Please report any issues you find!

By default the codemod is expected to be ran at the root of your project, at the same level as the `/app` directory.
The codemod is **non-destructive** meaning that the analyzed models aren't removed. Instead the codemod generates new files located at `app/data/` directory.

#### Migrating models and mixins

WarpDrive doesn't require users to follow a specific file structure, but it does come with a recommendation.


#### Caveats

> [!TIP]
> The codemod includes "knobs" to help with this situation that can be configured via a json file.
> [`example.config.json`](https://github.com/mainmatter/warp-drive/blob/4f736d04a4a03706b05bbf108f2e16a205fba53c/packages/codemods/src/schema-migration/example.config.json). See all available options in [`config.ts`](https://github.com/mainmatter/warp-drive/blob/4f736d04a4a03706b05bbf108f2e16a205fba53c/packages/codemods/src/schema-migration/config.ts#L3)
> `npx @ember-data/codemods apply migrate-to-schema --config=./example-codemod.config.json` 

- Codemod requires manual input and additional configuration for deep hierarchies. Such as "Base classes" or Re-exported models or models imported from libraries.

#### Basic Usage

```bash
# Transform all models and mixins in your app (looks at ./app by default)
npx @ember-data/codemods apply migrate-to-schema 
```

```bash
# With custom search path
npx @ember-data/codemods apply migrate-to-schema ./packages/ember-app/app 
```

#### Configuration File

Simple example:
```json
{
  "$schema": "./tools/warp-drive-codemod/config-schema.json",
  "version": "1.0.0",
  "description": "Example configuration for warp-drive-codemod",
  "dryRun": false,
  "verbose": false,
  "debug": false,
  "mirror": false,
  "importSubstitutes": [
    {
      "import": "my-app/core/base-model",
      "trait": "base-model-trait",
      "extension": "base-model-extension"
    }
  ],
  "modelImportSource": "my-app/models",
  "resourcesImport": "my-app/data/resources",
  "traitsDir": "./app/data/traits",
  "resourcesDir": "./app/data/resources",
  "typeMapping": {
    "uuid": "string",
    "currency": "number",
    "json": "unknown"
  }
}
```


Complex example:
```json
{
  "$schema": "./tools/warp-drive-codemod/config-schema.json",
  "version": "1.0.0",
  "description": "Configuration for MyClient WarpDrive migration",
  "dryRun": false,
  "verbose": false,
  "debug": false,
  "mirror": true,
  "emberDataImportSource": "@my-org/warp-drive/v1/model",
  "intermediateModelPaths": [
    "@my-org/client-core/core/custom-model",
    "my-client/core/base-model",
  ],
  "intermediateFragmentPaths": [
    "my-client/fragments/base-fragment",
    "@my-org/client-core/fragments/custom-fragment"
  ],
  "modelImportSource": "my-client/models",
  "mixinImportSource": "my-client/mixins",
  "modelSourceDir": "./apps/client/app/models",
  "mixinSourceDir": "./apps/client/app/mixins",
  "importSubstitutes": [
    {
      "import": "my-app/core/base-model",
      "trait": "base-model-trait",
      "extension": "base-model-extension"
    }
  ],
  "additionalModelSources": [
    {
      "pattern": "@my-org/client-core/core/custom-model",
      "dir": "libraries/client-core/package/src/core/custom-model"
    }
  ],
  "additionalMixinSources": [
    {
      "pattern": "@my-org/client-core/mixins/*",
      "dir": "libraries/client-core/package/src/mixins/*"
    },
    {
      "pattern": "@my-org/schema-decorators/mixins/*",
      "dir": "libraries/schema-decorators/mixins/*"
    }
  ],
  "resourcesImport": "my-client/data/resources",
  "traitsDir": "./apps/client/app/data/traits",
  "traitsImport": "my-client/data/traits",
  "extensionsDir": "./apps/client/app/data/extensions",
  "extensionsImport": "my-client/data/extensions",
  "resourcesDir": "./apps/client/app/data/resources"
}
```

See `packages/codemods/src/schema-migration/config-schema.json` for full configuration options.

#### Examples

**Before (EmberData Model):**
```ts
import Model, { attr, belongsTo, hasMany } from '@ember-data/model';

export default class User extends Model {
  @attr('string') declare name: string;
  @attr('string') declare email: string;
  @belongsTo('company', { async: false }) declare company: Company;
  @hasMany('project', { async: true }) declare projects: Project[];

  get displayName() {
    return this.name || this.email;
  }

  async updateProfile(data) {
    this.setProperties(data);
    return this.save();
  }
}
```

**After (Generated Schema):**
```ts
// app/resources/user.schema.ts
const UserSchema = {
  type: 'user',
  fields: {
    name: { kind: 'attribute', type: 'string' },
    email: { kind: 'attribute', type: 'string' },
    company: { kind: 'belongsTo', type: 'company', options: { async: false } },
    projects: { kind: 'hasMany', type: 'project', options: { async: true } }
  }
};

export default UserSchema;

export interface UserTrait {
  [Type]: 'user';
  name: string;
  email: string;
  company: Company;
  projects: Project[];
}

// NOTE: The codemod is expected to also "extend" this interface with the `extension` properties (TBD)
// import { UserExtension } './user.ext';
// export interface User extends UserTrait, UserExtension {}
```

**Generated Extension:**
```ts
// app/resources/user.ext.ts

// NOTE: The codemod is expected to also "extend" this interface with the `extension` properties (TBD)
// import { UserTrait } './user.schema';
// export interface UserExtension extends UserTrait {};

export class UserExtension {
  get displayName() {
    return this.name || this.email;
  }

  async updateProfile(data) {
    this.setProperties(data);
    return this.save();
  }
}
```


### legacy-compat-builders

```
npx @ember-data/codemods apply legacy-compat-builders --help
Usage: @ember-data/codemods apply legacy-compat-builders [options] <target-glob-pattern...>

Updates legacy store methods to use `store.request` and `@ember-data/legacy-compat/builders` instead.

Arguments:
  target-glob-pattern                    Path to files or glob pattern. If using glob pattern, wrap in single
                                         quotes.

Options:
  -d, --dry                              dry run (no changes are made to files) (default: false)
  -v, --verbose <level>                  Show more information about the transform process (choices: "0", "1",
                                         "2", default: "0")
  -l, --log-file [path]                  Write logs to a file. If option is set but no path is provided, logs are
                                         written to ember-data-codemods.log
  -i, --ignore <ignore-glob-pattern...>  Ignores the given file or glob pattern. If using glob pattern, wrap in
                                         single quotes.
  --store-names <store-name...>          Identifier name associated with the store. If overriding, it is
                                         recommended that you include 'store' in your list. (default: ["store"])
  --method, --methods <method-name...>   Method name(s) to transform. By default, will transform all methods.
                                         (choices: "findAll", "findRecord", "query", "queryRecord", "saveRecord")
  -h, --help                             display help for command
```

#### Examples

##### `findAll`

```ts
// before
const posts = await store.findAll<Post>('post');

// after
import { findAll } from '@ember-data/legacy-compat/builders';
const { content: posts } = await store.request<Post[]>(findAll<Post>('post'));
```

##### `findRecord`

```ts
// before
const post = await store.findRecord<Post>({ type: 'post', id: '1' });

// after
import { findRecord } from '@ember-data/legacy-compat/builders';
const { content: post } = await store.request<Post>(findRecord<Post>({ type: 'post', id: '1' }));
```

NOTE: This codemod will not transform `store.findRecord` calls with a 'preload' option set. This option is not supported by the legacy compat builders.

##### `query`

```ts
// before
const posts = await store.query<Post>('post', { id: '1' });

// after
import { query } from '@ember-data/legacy-compat/builders';
const { content: posts } = await store.request<Post[]>(query<Post>('post', { id: '1' }));
```

##### `queryRecord`

```ts
// before
const post = await store.queryRecord<Post>('post', { id: '1' });

// after
import { queryRecord } from '@ember-data/legacy-compat/builders';
const { content: post } = await store.request<Post>(queryRecord<Post>('post', { id: '1' }));
```

##### `saveRecord`

```ts
// before
const post = store.createRecord<Post>('post', { name: 'Krystan rules, you drool' });
const savedPostWithGeneric = await store.saveRecord<Post>(post);
const savedPostNoGeneric = await store.saveRecord(post);

// after
import { saveRecord } from '@ember-data/legacy-compat/builders';
const post = store.createRecord<Post>('post', { name: 'Krystan rules, you drool' });
const { content: savedPostWithGeneric } = await store.request<Post>(saveRecord(post));
const { content: savedPostNoGeneric } = await store.request(saveRecord(post));
```

#### Handling of `await`

Calls to legacy store methods that are not currently awaited will not be transformed. In order to provide feature parity with the legacy method, we need to access the `content` property from `Future` returned by `store.request`. In order to do this, we need to `await store.request`, but we can't safely add `await` with a codemod as we don't know if the consuming code will be able to handle the change.

There is one exception to this rule. In the case where a route's `model` hook returns a call to a legacy store method, the codemod will transform the legacy store method and will add the `await` keyword.

#### Caveats

GJS and GTS files are not currently supported. PRs welcome! 🧡
