---
categoryTitle: Migrating
title: V3/V4 to V5
outline:
  level: 2,3
categoryOrder: 4
---

# Migrating 4.x to 5.x

This guide will *likely* work for apps on 3.28 that have resolved EmberData deprecations from the 3.x series.

This guide is primarily intended for apps that got ***"stuck"*** on either 4.6 (due to ModelFragments) or 4.12 (typically due to the ArrayLike deprecation)

Note - it is not actually a requirement of 5.x to replace Models with Schemas (nor to replace adapters/serializers with requests). These things are deprecated *in* 5.x, but they still work.

The reason to take the approach outlined in this guide is
because we have used capabilities provided by the [@warp-drive/legacy package](/api/@warp-drive/legacy/) and by [LegacyMode](../the-manual/schemas/resources/polaris-mode.md) schemas together with [Extensions](/api/@warp-drive/core/reactive/interfaces/CAUTION_MEGA_DANGER_ZONE_Extension) to mimic much of the removed API surface to allow apps to bridge the gap to 5.x more easily. 

## Pre-Migration (update to Native Types)

If you use Typescript, before migrating, you should update your types to use the native types provided by both `ember-source` and WarpDrive.

You can do this even if you are on an older version (pre-5.x) that
didn't ship it's own types by using the "types" packages we specially publish for this purpose.

### Step 1 - delete all the ember/ember-data DT type packages

```package.json
{
  "dependencies": { 
    "@types/ember": "4.0.11", // [!code --:25]
    "@types/ember-data": "4.4.16",
    "@types/ember-data__adapter": "4.0.6",
    "@types/ember-data__model": "4.0.5",
    "@types/ember-data__serializer": "4.0.6",
    "@types/ember-data__store": "4.0.7",
    "@types/ember__application": "4.0.11",
    "@types/ember__array": "4.0.10",
    "@types/ember__component": "4.0.22",
    "@types/ember__controller": "4.0.12",
    "@types/ember__debug": "4.0.8",
    "@types/ember__destroyable": "4.0.5",
    "@types/ember__engine": "4.0.11",
    "@types/ember__error": "4.0.6",
    "@types/ember__helper": "4.0.7",
    "@types/ember__modifier": "4.0.9",
    "@types/ember__object": "4.0.12",
    "@types/ember__owner": "4.0.9",
    "@types/ember__routing": "4.0.22",
    "@types/ember__runloop": "4.0.10",
    "@types/ember__service": "4.0.9",
    "@types/ember__string": "3.16.3",
    "@types/ember__template": "4.0.7",
    "@types/ember__test": "4.0.6",
    "@types/ember__utils": "4.0.7",
  }
}
```

### Step 2 - install the official packages using the latest versions.

Each package that we publish has a corresponding types-only package that you can use to gain access to official types while still using an older version of the library that doesn't have its own types yet.

<div style="width: fit-content; margin: 0 auto;">

| Package | Types Package |
| ------- | ------------- |
| `ember-data` | `ember-data-types` |
| `@ember-data/*` | `@ember-data-types/*` |
| `@warp-drive/*` | `@warp-drive-types/*` |

</div>

:::tip 💡 Why are there non-types packages below?
Starting in 5.7, due to package unification these
types also require the installation of the new
"package unification" packages since the actual source code (and types)
originates from there.
:::

::: code-group

```sh [pnpm]
pnpm add -E ember-data-types@latest \
  @ember-data-types/adapter@latest \
  @ember-data-types/graph@latest \
  @ember-data-types/json-api@latest \
  @ember-data-types/legacy-compat@latest \
  @ember-data-types/model@latest \
  @ember-data-types/request@latest \
  @ember-data-types/request-utils@latest \
  @ember-data-types/serializer@latest \
  @ember-data-types/store@latest \
  @warp-drive-types/core-types@latest \
  @warp-drive/core@latest \
  @warp-drive/json-api@latest \
  @warp-drive/legacy@latest \
  @warp-drive/utilities@latest
```

```sh [npm]
npm add -E ember-data-types@latest \
  @ember-data-types/adapter@latest \
  @ember-data-types/graph@latest \
  @ember-data-types/json-api@latest \
  @ember-data-types/legacy-compat@latest \
  @ember-data-types/model@latest \
  @ember-data-types/request@latest \
  @ember-data-types/request-utils@latest \
  @ember-data-types/serializer@latest \
  @ember-data-types/store@latest \
  @warp-drive-types/core-types@latest
  @warp-drive/core@latest \
  @warp-drive/json-api@latest \
  @warp-drive/legacy@latest \
  @warp-drive/utilities@latest
```

```sh [yarn]
yarn add -E ember-data-types@latest \
  @ember-data-types/adapter@latest \
  @ember-data-types/graph@latest \
  @ember-data-types/json-api@latest \
  @ember-data-types/legacy-compat@latest \
  @ember-data-types/model@latest \
  @ember-data-types/request@latest \
  @ember-data-types/request-utils@latest \
  @ember-data-types/serializer@latest \
  @ember-data-types/store@latest \
  @warp-drive-types/core-types@latest
  @warp-drive/core@latest \
  @warp-drive/json-api@latest \
  @warp-drive/legacy@latest \
  @warp-drive/utilities@latest
```

```sh [bun]
bun add --exact ember-data-types@latest \
  @ember-data-types/adapter@latest \
  @ember-data-types/graph@latest \
  @ember-data-types/json-api@latest \
  @ember-data-types/legacy-compat@latest \
  @ember-data-types/model@latest \
  @ember-data-types/request@latest \
  @ember-data-types/request-utils@latest \
  @ember-data-types/serializer@latest \
  @ember-data-types/store@latest \
  @warp-drive-types/core-types@latest
  @warp-drive/core@latest \
  @warp-drive/json-api@latest \
  @warp-drive/legacy@latest \
  @warp-drive/utilities@latest
```

:::

This will install the following at the latest release


```package.json
{
  "dependencies": { 
    "ember-data-types": "latest", // [!code ++:15]
    "@ember-data-types/adapter": "latest",
    "@ember-data-types/graph": "latest",
    "@ember-data-types/json-api": "latest",
    "@ember-data-types/legacy-compat": "latest",
    "@ember-data-types/model": "latest",
    "@ember-data-types/request-utils": "latest",
    "@ember-data-types/request": "latest",
    "@ember-data-types/serializer": "latest",
    "@ember-data-types/store": "latest",
    "@warp-drive-types/core-types": "latest",
    "@warp-drive/core": "latest",
    "@warp-drive/json-api": "latest"
    "@warp-drive/legacy": "latest",
    "@warp-drive/utilities": "latest",
  }
}
```

### Step 3 - configure tsconfig.json

```diff
 {
   "compilerOptions": {
     "types": [
        "ember-source/types", // [!code ++:12]
        "ember-data-types/unstable-preview-types",
        "@ember-data-types/store/unstable-preview-types",
        "@ember-data-types/adapter/unstable-preview-types",
        "@ember-data-types/graph/unstable-preview-types",
        "@ember-data-types/json-api/unstable-preview-types",
        "@ember-data-types/legacy-compat/unstable-preview-types",
        "@ember-data-types/request/unstable-preview-types",
        "@ember-data-types/request-utils/unstable-preview-types",
        "@ember-data-types/model/unstable-preview-types",
        "@ember-data-types/serializer/unstable-preview-types",
        "@warp-drive-types/core-types/unstable-preview-types"
      ]
    }
 }
```

### Step 4 - brand your models

```ts
import Model from '@ember-data/model';
import type { Type } from '@warp-drive/core-types/symbols';

export default class User extends Model {
  declare [Type]: 'user';
}
```

### Step 5 - replace registry usage with branded model usages

```ts
// find
store.findRecord('user', '1'); // [!code --]
store.findRecord<User>('user', '1');  // [!code ++]

store.findAll('user'); // [!code --]
store.findAll<User>('user');  // [!code ++]

store.query('user', {}); // [!code --]
store.query<User>('user');  // [!code ++]

store.queryRecord('user', {}); // [!code --]
store.queryRecord<User>('user');  // [!code ++]

// peek
store.peekRecord('user', '1'); // [!code --]
store.peekRecord<User>('user', '1');  // [!code ++]

// push
const user = store.push({ // [!code --]
const user = store.push<User>({ // [!code ++]
  data: {
    type: 'user',
    id: '1',
    attributes: { name: 'Chris' }
  }
}) as User;  // [!code --]
});  // [!code ++]
```

**Additional Resources**

- [Typing Requests](/guides/the-manual/requests/typing-requests)
- [Typing Models](/guides/the-manual/misc/typescript/typing-models)
- [Why Brands](/guides/the-manual/misc/typescript/why-brands)

### Step 6 - fix other type issues that arise

ArrayLike API usage is likely to give you the most issues here, if anything does.

## Migration

### Step 1 - Install the Mirror Packages

::: code-group

```sh [pnpm]
pnpm add -E @warp-drive-mirror/core@latest @warp-drive-mirror/json-api@latest @warp-drive-mirror/ember@latest @warp-drive-mirror/legacy@latest @warp-drive-mirror/utilities@latest
```

```sh [npm]
npm add -E @warp-drive-mirror/core@latest @warp-drive-mirror/json-api@latest @warp-drive-mirror/ember@latest @warp-drive-mirror/legacy@latest @warp-drive-mirror/utilities@latest
```

```sh [yarn]
yarn add -E @warp-drive-mirror/core@latest @warp-drive-mirror/json-api@latest @warp-drive-mirror/ember@latest @warp-drive-mirror/legacy@latest @warp-drive-mirror/utilities@latest
```

```sh [bun]
bun add --exact @warp-drive-mirror/core@latest @warp-drive-mirror/json-api@latest @warp-drive-mirror/ember@latest @warp-drive-mirror/legacy@latest @warp-drive-mirror/utilities@latest
```

:::

This will install the following at the latest release


```package.json
{
  "dependencies": {
    "@warp-drive-mirror/core": "latest",  // [!code ++:5]
    "@warp-drive-mirror/ember": "latest",
    "@warp-drive-mirror/json-api": "latest"
    "@warp-drive-mirror/legacy": "latest",
    "@warp-drive-mirror/utilities": "latest",
  }
}
```

### Step 2 - Configure The Build


::: tabs key:paradigm

== Classic Config

```ts [ember-cli-build.js]
'use strict';
const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const { compatBuild } = require('@embroider/compat');

module.exports = async function (defaults) {
  const { setConfig } = await import('@warp-drive-mirror/core/build-config'); // [!code focus]
  const { buildOnce } = await import('@embroider/vite');
  const app = new EmberApp(defaults, {});

  setConfig(app, __dirname, { // [!code focus:9]
    // this should be the most recent <major>.<minor> version for
    // which all deprecations have been fully resolved
    // and should be updated when that changes
    compatWith: '4.12',
    deprecations: {
      // ... list individual deprecations that have been resolved here
    }
  });

  return compatBuild(app, buildOnce);
};
```

== Vite Minimal Config

```ts [babel.config.mjs]
import { setConfig } from '@warp-drive-mirror/core/build-config';
import { buildMacros } from '@embroider/macros/babel';

const Macros = buildMacros({
  configure: (config) => {
    setConfig(config, {
      // for universal apps this MUST be at least 5.6
      compatWith: '5.6'
    });
  },
});

export default {
  plugins: [
    ...Macros.babelMacros,
  ],
};
```

:::

### Step 3 - Configure Reactivity

Next we configure WarpDrive to use Ember's signals implementation.
Add this near the top of your `app/app.ts` file. If you already
have `import '@warp-drive/ember/install';` leave that too, you'll need
both. Their order does not matter.

```ts [app/app.ts]
import '@warp-drive-mirror/ember/install';
```

### Step 4 - Configure the Store

We use `useLegacyStore` to create a store service preconfigured with maximal support for legacy APIs.

:::tabs

== Coming from 4.12

```ts [app/services/v2-store.ts]
import { useLegacyStore } from '@warp-drive/legacy';
import { JSONAPICache } from '@warp-drive/json-api';

const Store = useLegacyStore({
  legacyRequests: true,
  cache: JSONAPICache,
  schemas: [
     // -- your schemas here for
     // anything migrated off of Model
  ],
  handlers: [
    // -- your additional handlers here
    // Fetch, LegacyNetworkHandler, and CacheHandler
    // are automatically provided when needed
  ]
});
type Store = InstanceType<typeof Store>;

export default Store;
```

== Coming from ModelFragments + 4.6

```ts [app/services/v2-store.ts]
import { useLegacyStore } from '@warp-drive/legacy';
import { JSONAPICache } from '@warp-drive/json-api';

export default useLegacyStore({
  legacyRequests: true,
  modelFragments: true,
  cache: JSONAPICache,
  schemas: [
     // -- your schemas here for
     // anything migrated off of Model
  ],
  handlers: [
    // -- your additional handlers here
    // Fetch, LegacyNetworkHandler, and CacheHandler
    // are automatically provided when needed
  ]
});
```

:::

**Additional Reading** (for when you have questions later)

- [useLegacyStore](/api/@warp-drive/legacy/functions/useLegacyStore)
  - [LinksMode setting](/api/@warp-drive/legacy/interfaces/LegacyModelAndNetworkAndRequestStoreSetupOptions#linksmode)
  - [legacyRequests setting](/api/@warp-drive/legacy/interfaces/LegacyModelAndNetworkAndRequestStoreSetupOptions#legacyrequests)
  - [modelFragments setting](/api/@warp-drive/legacy/interfaces/LegacyModelAndNetworkAndRequestStoreSetupOptions#modelfragments)
  - About the [LinksMode feature](/guides/the-manual/misc/links-mode)
- [Model Migration Support](/api/@warp-drive/legacy/model/migration-support/)
  - the legacy store uses the [DelegatingSchemaService](/api/@warp-drive/legacy/model/migration-support/classes/DelegatingSchemaService)
  - [withDefaults](/api/@warp-drive/legacy/model/migration-support/functions/withDefaults)
  - [withRestoredDeprecatedModelRequestBehaviors](/api/@warp-drive/legacy/model/migration-support/functions/withRestoredDeprecatedModelRequestBehaviors)
  - [EmberObject Extension](/api/@warp-drive/legacy/compat/extensions/variables/EmberObjectExtension)
  - [EmberObject Extension for Arrays](/api/@warp-drive/legacy/compat/extensions/variables/EmberObjectArrayExtension)
  - [EmberArrayLike Extension](/api/@warp-drive/legacy/compat/extensions/variables/EmberArrayLikeExtension)
- [Legacy Store Methods](/api/@warp-drive/legacy/store/functions/restoreDeprecatedStoreBehaviors)

### Step 5 - Convert + Profit

Key concepts:

- [LegacyResourceSchema](/api/@warp-drive/core/types/schema/fields/interfaces/LegacyResourceSchema)
- [LegacyModeFieldSchema](/api/@warp-drive/core/types/schema/fields/type-aliases/LegacyModeFieldSchema)
- [registerTrait](/api/@warp-drive/core/types/schema/schema-service/interfaces/SchemaService#registertrait)
- [LegacyTrait](/api/@warp-drive/core/types/schema/fields/interfaces/LegacyTrait)
- [CAUTION_MEGA_DANGER_ZONE_registerExtension()](/api/@warp-drive/core/types/schema/schema-service/interfaces/SchemaService#caution-mega-danger-zone-registerextension)
- [CAUTION_MEGA_DANGER_ZONE_Extension](/api/@warp-drive/core/reactive/interfaces/CAUTION_MEGA_DANGER_ZONE_Extension)

---

Migrating away from Model involves decomposing the various responsibilities it
may have taken on in your codebase into the correct corresponding primitive.

Below is a complete example of migrating a Model with a Mixin. After showing the
full breakdown, we'll walk through decomposing the Model and Mixin files in discrete
steps in order to teach you about each part of the change.

We don't expect you to do this migration manually, but instead to use the provided
codemod.


:::tabs key:model-migration

== Before

```ts [app/models/user.ts]
import Model, { attr, belongsTo, hasMany, type AsyncHasMany } from '@ember-data/model';
import type { Type } from '@warp-drive/core-types/symbols';
import { cached } from '@glimmer/tracking';
import { computed } from '@ember/object';
import Timestamped from '../mixins/timestamped';

export default class User extends Model.extend(Timestamped) {
  declare [Type]: 'user';

  @attr declare firstName: string;
  @attr declare lastName: string;

  @belongsTo('user', { async: false, inverse: null })
  declare bestFriend: User | null;

  @hasMany('user', { async: true, inverse: null })
  declare friends: AsyncHasMany<User>;

  @cached
  get fullName(): string {
    return this.firstName + ' ' + this.lastName;
  }

  @computed('firstName')
  get greeting(): string {
    return 'Hello ' + this.firstName + '!';
  }

  sayHi(): void {
    alert(this.greeting);
  }
}
```

== After

:::code-group

```ts [app/data/user/schema.ts]
import { withDefaults } from '@warp-drive-mirror/legacy/model/migration-support';

export const UserSchema = withDefaults({
  type: 'user',
  fields: [
    { kind: 'attribute', name: 'firstName' },
    { kind: 'attribute', name: 'lastName' },
    { 
      kind: 'belongsTo',
      name: 'bestFriend',
      type: 'user',
      options: { async: false, inverse: null }
    },
    {
      kind: 'hasMany',
      name: 'friends',
      type: 'user',
      options: { async: true, inverse: null }
    },
  ],
  traits: ['timestamped'],
  objectExtensions: ['timestamped-extension', 'user-extension']
});
```

```ts [app/data/user/type.ts]
import { WithLegacy } from '@warp-drive-mirror/legacy/model/migration-support';
import { type AsyncHasMany } from '@warp-drive-mirror/legacy/model';
import type { Type } from '@warp-drive-mirror/core/types/symbols';
import type { Timestamped } from '../timstamped/type.ts';
import type { TimestampedExtension } from '../timestamped/ext.ts';

export interface User extends Timestamped {
  [Type]: 'user';
  firstName: string;
  lastName: string;
  user: User | null;
  friends: AsyncHasMany<User>;
};

export interface LegacyUser extends WithLegacy<User>, TimestampedExtension {}
```

```ts [app/data/user/ext.ts]
import { cached } from '@glimmer/tracking';
import { computed } from '@ember/object';
import { LegacyUser } from './type.ts';

export interface UserExtension extends LegacyUser {}
export class UserExtension {
  @cached
  get fullName() {
    return this.firstName + ' ' + this.lastName;
  }

  @computed('firstName')
  get greeting() {
    return 'Hello ' + this.firstName + '!';
  }

  sayHi() {
    alert(this.greeting);
  }
}

export const UserExtensionSchema = {
  name: 'user-extension',
  kind: 'object',
  features: UserExtension,
}
```

:::

:::tabs key:model-migration

== Before

```ts [app/mixins/timestamped.ts]
import Mixin from '@ember/object/mixin';
import { attr } from '@ember-data/model';

export default Mixin.create({
  createdAt: attr(),
  deletedAt: attr(),
  updatedAt: attr(),

  async softDelete(): Promise<void> {
    const result = await fetch(`/api/${this.constructor.modelName}/${this.id}`, { method: 'DELETE' });
    const newTimestamps = await result.json();
    this.store.push({
      data: {
        type: this.constructor.modelName,
        id: this.id,
        attributes: newTimestamps
      }
    });
  }
});
```

== After

:::code-group

```ts [app/data/traits/timestamped/schema.ts]
export const TimetampedTrait = {
  name: 'timestamped',
  mode: 'legacy',
  fields: [
    { kind: 'attribute', name: 'createdAt' },
    { kind: 'attribute', name: 'deletedAt' },
    { kind: 'attribute', name: 'updatedAt' },
  ],
}
```

```ts [app/data/traits/timestamped/type.ts]
export interface Timestamped {
  createdAt: number;
  deletedAt: number | null;
  updatedAt: number;
}
```

```ts [app/data/traits/timestamped/ext.ts]
import Mixin from '@ember/object/mixin';
import { attr } from '@ember-data/model';
import { Timestamped } from './type.ts';

export interface TimestampedExtension extends Timestamped {}
export const TimestampedExtension = {
  async softDelete(): Promise<void> {
    const result = await fetch(`/api/${this.constructor.modelName}/${this.id}`, { method: 'DELETE' });
    const newTimestamps = await result.json();
    this.store.push({
      data: {
        type: this.constructor.modelName,
        id: this.id,
        attributes: newTimestamps
      }
    });
  }
}

export const TimestampedExtensionSchema = {
  kind: 'object',
  name: 'timestamped-extension',
  features: TimestampedExtension
});
```

:::

1. The file-path based convention for defining the ResourceType is replaced with specifying a ResourceType on a ResourceSchema. File paths are now purely organizational and discretionary.

```ts [app/data/user/schema.ts]
// The ResourceSchema in this example is intentionally
// incomplete, we will fill it out below
//
const UserSchema = {
  type: 'user',
}
```

2. We differentiate between schemas for embedded objects (which have no identity of their own) and 
schemas for resources (which do have their own identity) by specifying a primaryKey. On `Model` this
was `id` (this is also added by `withDefaults` which we'll see next).

```ts [app/data/user/schema.ts]
// The ResourceSchema in this example is intentionally
// incomplete, we will fill it out below
//
const UserSchema = {
  type: 'user',
  identity: { kind: '@id', name: 'id' } // [!code ++]
}
```

3. We put the ResourceSchema in "LegacyMode" so that our ReactiveResources will behave in the same
mutable manner as Model did.

```ts [app/data/user/schema.ts]
// The ResourceSchema in this example is intentionally
// incomplete, we will fill it out below
//
const UserSchema = {
  type: 'user',
  identity: { kind: '@id', name: 'id' },
  legacy: true,// [!code ++]
}
```

4. We decorate our ResourceSchema with the default behaviors that Models had (fields like `isNew` `hasDirtyAttributes` or `currentState` as well as methods like `rollbackAttributes` and `save`).

This also automatically sets us up in `LegacyMode` and adds the `id` field for identity, in effect this replaces `class User extends Model`.

```ts [app/data/user/schema.ts]
import { withDefaults } from '@warp-drive-mirror/legacy/model/migration-support';
// The ResourceSchema in this example is intentionally
// incomplete, we will fill it out below
//
const UserSchema = withDefaults({ // [!code ++]
  type: 'user',
  identity: { kind: '@id', name: 'id' }, // [!code --]
  legacy: true,// [!code --]
}) // [!code ++]
```

5. Schema properties from the Model (`hasMany` `belongsTo` and `attr`) become fields on the matching ResourceSchema

```ts [app/data/user/schema.ts]
import { withDefaults } from '@warp-drive-mirror/legacy/model/migration-support';
// The ResourceSchema in this example is intentionally
// incomplete, we will fill it out below
//
const UserSchema = withDefaults({
  type: 'user',
  fields: [ // [!code ++:16]
    { kind: 'attribute', name: 'firstName' },
    { kind: 'attribute', name: 'lastName' },
    { 
      kind: 'belongsTo',
      name: 'bestFriend',
      type: 'user',
      options: { async: false, inverse: null }
    },
    {
      kind: 'hasMany',
      name: 'friends',
      type: 'user',
      options: { async: true, inverse: null }
    },
  ],
})
```

6. Mixins get converted to traits.

Because Model functioned as a `type`, a `ResourceSchema`, a reactive object, and 

We migrate models with ResourceSchemas and extensions.

:::tabs

== Before

```ts [app/models/user.ts]
import Model, { attr, belongsTo, hasMany, type AsyncHasMany } from '@ember-data/model';
import type { Type } from '@warp-drive/core-types/symbols';
import { cached } from '@glimmer/tracking';
import { computed } from '@ember/object';

export default class User extends Model {
  declare [Type]: 'user';

  @attr firstName;
  @attr lastName;

  @belongsTo('user', { async: false, inverse: null })
  declare bestFriend: User | null;

  @hasMany('user', { async: true, inverse: null })
  declare friends: AsyncHasMany<User>;

  @cached
  get fullName() {
    return this.firstName + ' ' + this.lastName;
  }

  @computed('firstName')
  get greeting() {
    return 'Hello ' + this.firstName + '!';
  }

  sayHi() {
    alert(this.greeting);
  }
}
```

== After

:::code-group

```ts [app/data/user/schema.ts]
import { withDefaults } from '@warp-drive-mirror/legacy/model/migration-support';

export const UserSchema = withDefaults({
  type: 'user',
  fields: [
    { kind: 'attribute', name: 'firstName' },
    { kind: 'attribute', name: 'lastName' },
    { 
      kind: 'belongsTo',
      name: 'bestFriend',
      type: 'user',
      options: { async: false, inverse: null }
    },
    {
      kind: 'hasMany',
      name: 'friends',
      type: 'user',
      options: { async: true, inverse: null }
    },
  ],
  objectExtensions: ['user-extension'],
});
```

```ts [app/data/user/type.ts]
import { WithLegacy } from '@warp-drive-mirror/legacy/model/migration-support';
import { type AsyncHasMany } from '@warp-drive-mirror/legacy/model';
import type { Type } from '@warp-drive-mirror/core/types/symbols';

export type User = WithLegacy<{
  [Type]: 'user';
  firstName: string;
  lastName: string;
  user: User | null;
  friends: AsyncHasMany<User>;
}>;
```

```ts [app/data/user/ext.ts]
import { cached } from '@glimmer/tracking';
import { computed } from '@ember/object';
import { User } from './type.ts';

export interface UserExtension extends User {}
export class UserExtension {
  @cached
  get fullName() {
    return this.firstName + ' ' + this.lastName;
  }

  @computed('firstName')
  get greeting() {
    return 'Hello ' + this.firstName + '!';
  }

  sayHi() {
    alert(this.greeting);
  }
}

export const UserExtensionSchema = {
  name: 'user-extension',
  kind: 'object',
  features: UserExtension,
}
```

:::

#### A Model with Mixins

We can migrate mixins with traits and extensions.

:::tabs

== Before

:::code-group

```ts [app/models/user.ts]
import Model, { attr } from '@ember-data/model';
import type { Type } from '@warp-drive/core-types/symbols';
import Timestamped from '../mixins/timestamped';

export default class User extends Model.extend(Timestamped) {
  declare [Type]: 'user';

  @attr firstName;
  @attr lastName;
}
```

```ts [app/mixins/timestamped.ts]
import Mixin from '@ember/object/mixin';
import { attr } from '@ember-data/model';

export default Mixin.create({
  createdAt: attr(),
  deletedAt: attr(),
  updatedAt: attr(),

  async softDelete() {
    const result = await fetch(`/api/${this.constructor.modelName}/${this.id}`, { method: 'DELETE' });
    const newTimestamps = await result.json();
    this.store.push({
      data: {
        type: this.constructor.modelName,
        id: this.id,
        attributes: newTimestamps
      }
    });
  }
});
```

== After

:::code-group

```ts [app/data/user/schema.ts]
import { withDefaults } from '@warp-drive-mirror/legacy/model/migration-support';

export const UserSchema = withDefaults({
  type: 'user',
  fields: [
    { kind: 'attribute', name: 'firstName' },
    { kind: 'attribute', name: 'lastName' },
  ],
  traits: ['timestamped'],
  objectExtensions: ['timestamped-extension']
});
```

```ts [app/data/user/type.ts]
import { WithLegacy } from '@warp-drive-mirror/legacy/model/migration-support';
import { type AsyncHasMany } from '@warp-drive-mirror/legacy/model';
import type { Type } from '@warp-drive-mirror/core/types/symbols';
import type { Timestamped } from '../timstamped/type.ts';

export interface User extends Timestamped {
  [Type]: 'user';
  firstName: string;
  lastName: string;
  user: User | null;
  friends: AsyncHasMany<User>;
};

export type LegacyUser = WithLegacy<User>;
```

```ts [app/data/timestamped/schema.ts]
export const TimetampedTrait = {
  name: 'timestamped',
  mode: 'legacy',
  fields: [
    { kind: 'attribute', name: 'createdAt' },
    { kind: 'attribute', name: 'deletedAt' },
    { kind: 'attribute', name: 'updatedAt' },
  ],
}
```

```ts [app/data/timestamped/type.ts]
export interface Timestamped {
  createdAt: number;
  deletedAt: number | null;
  updatedAt: number;

  softDelete: Promise<void>;
}
```

```ts [app/data/timestamped/ext.ts]
import Mixin from '@ember/object/mixin';
import { attr } from '@ember-data/model';

export const TimestampedExtension = {
  kind: 'object',
  name: 'timestamped-extension',
  features: {
    async softDelete() {
      const result = await fetch(`/api/${this.constructor.modelName}/${this.id}`, { method: 'DELETE' });
      const newTimestamps = await result.json();
      this.store.push({
        data: {
          type: this.constructor.modelName,
          id: this.id,
          attributes: newTimestamps
        }
      });
    }
  }
});
```

:::

#### A Model with Fragments

:::tabs

== Before

```ts
TBD
```

== After

:::code-group

```ts [app/data/user/schema.ts]
TBD
```

```ts [app/data/user/type.ts]
TBD
```

```ts [app/data/user/ext.ts]
TBD
```

:::

## Post Migration

- drop the old packages
- drop config for the old packages
- delete the store service
- rename v2-store => store
- rename packages and imports from `@warp-drive-mirror` to `@warp-drive`
