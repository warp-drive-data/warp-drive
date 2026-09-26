# @ember-data/model

This package provides runtime classes for use as a source of ResourceSchema and as a ReactiveResource for older "legacy" EmberData/WarpDrive configurations.

It re-exports [`@warp-drive/legacy/model`](/api/@warp-drive/legacy/model/), whose documentation covers why Models
are legacy and what replaces them.

**When you still need this:** Only use Model classes if you're maintaining an existing Ember application that hasn't migrated to modern WarpDrive schemas.

For guidance on migrating from Model classes to schema objects, see the [Schema Guide](/guides/the-manual/schemas/) and [Migration Guide](/guides/migrating/).

## Legacy Models

This package provides a Presentation Model for resource data in an EmberData Cache. It implements the
Store's `instantiateRecord` and `teardownRecord` hooks and configures an associated `SchemaService`.

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

```js [app/models/person.js]
import Model, { attr, belongsTo, hasMany } from "@ember-data/model";

export default class PersonModel extends Model {
  @attr name;

  @belongsTo("pet", { inverse: "owners", async: false }) dog;

  @hasMany("person", { inverse: "friends", async: true }) friends;
}
```

### modelName convention

By convention, the name of a given model (its `type`) matches the name
of the file in the `app/models` folder and should be lowercase, singular
and dasherized.
