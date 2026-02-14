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

# @ember-data/model

> [!WARNING]
> **Legacy Package**
>
> **Model classes are a LEGACY feature** that is no longer encouraged for new applications.
>
> **Why it's legacy:** The Model class pattern uses class inheritance and runtime decorator parsing to define your data schema. This approach:
> - Parses schema at runtime by inspecting class decorators, increasing initial load time
> - Creates heavy class instances for every record, impacting memory and performance
> - Tightly couples your data structure to Ember-specific patterns (computed properties, observers)
> - Makes it difficult to share data logic across frameworks (React, Vue, Svelte)
> - Lacks static type safety (TypeScript types don't match runtime schema)
> - Requires inheritance chains that increase bundle size and complexity
>
> **Modern alternative:** Use **schema objects**` from `@warp-drive/core`. Modern WarpDrive:
> - Defines schemas as static objects that can be tree-shaken and validated at build time
> - Uses plain JavaScript objects for records, dramatically reducing memory overhead
> - Works identically across React, Vue, Svelte, and Ember
> - Provides full TypeScript type safety with schema-to-type generation
> - Supports schema derivations and transformations without inheritance
>
> **When you still need this:** Only use Model classes if you're maintaining an existing Ember application that hasn't migrated to modern WarpDrive schemas. For new projects, use `@warp-drive/core` with schema objects.
>
> **Migration path:** See the [Schema Guide](https://canary.warp-drive.io/guides/the-manual/schemas/) and [V4 to V5 Migration Guide](https://canary.warp-drive.io/guides/migrating) for migrating from Model classes to schema objects.

Runtime classes for use as a source of ResourceSchema and as a ReactiveResource for older "legacy" EmberData/WarpDrive configurations.

If using more recent versions of WarpDrive, install this via [@warp-drive/legacy](https://www.npmjs.com/package/@warp-drive/legacy) instead.

**Tagged Releases**

- ![NPM Canary Version](https://img.shields.io/npm/v/%40ember-data/model/canary?label=%40canary&color=FFBF00)
- ![NPM Beta Version](https://img.shields.io/npm/v/%40ember-data/model/beta?label=%40beta&color=ff00ff)
- ![NPM Stable Version](https://img.shields.io/npm/v/%40ember-data/model/latest?label=%40latest&color=90EE90)
- ![NPM LTS Version](https://img.shields.io/npm/v/%40ember-data/model/lts?label=%40lts&color=0096FF)
- ![NPM LTS 4.12 Version](https://img.shields.io/npm/v/%40ember-data/model/lts-4-12?label=%40lts-4-12&color=bbbbbb)

## About

This package implements the EmberData Store's `instantiateRecord` and `teardownRecord` hooks
as well as configures an associated `SchemaService` implementation.

Models are defined as classes extending from `import Model from '@ember-data/model';` and the
attributes and relationships on these classes are parsed at runtime to supply static "schema"
to EmberData's SchemaService.

Resource data for individual resources fetched from your API is presented to the UI via instances
of the `Model`s you define. An instantiated `Model` is referred to as a `record`.

When we refer to the `ModelClass` as opposed to a `Model` or `Record` we are referring
specifically to the class definition and the static schema methods present on it.

When we refer to a `record` we refer to a specific class instance presenting
the resource data for a given `type` and `id`.

### Defining a Model

*app/models/person.js*
```ts
import Model, { attr, belongsTo, hasMany } from '@ember-data/model';

export default class PersonModel extends Model {
  @attr name;

  @belongsTo('pet', { inverse: 'owners', async: false }) dog;

  @hasMany('person', { inverse: 'friends', async: true }) friends;
}
```

### modelName convention

By convention, the name of a given model (its `type`) matches the name
 of the file in the `app/models` folder and should be lowercase, singular
 and dasherized.
