/**
 * This package provides a Presentation Model for resource data in an WarpDrive Cache.
 *
 * Models are defined as classes extending from `import Model from '@warp-drive/legacy/model';` and the
 * attributes and relationships on these classes are parsed at runtime to supply static "schema"
 * to WarpDrive's SchemaService.
 *
 * Resource data for individual resources fetched from your API is presented to the UI via instances
 * of the `Model`s you define. An instantiated `Model` is referred to as a `record`.

  When we refer to the `ModelClass` as opposed to a `Model` or `Record` we are referring
  specifically to the class definition and the static schema methods present on it.

  When we refer to a `record` we refer to a specific class instance presenting
  the resource data for a given `type` and `id`.

  ### Why It's Legacy

  The `Model` pattern uses class inheritance and decorators to define your data schema:

  - The `attr`, `belongsTo` and `hasMany` decorators are Ember computed properties, and the
    schema is read at runtime by walking each Model class's computed properties.
  - Every record is an instance of its own `Model` subclass, and `Model` extends `EmberObject`,
    which ties your data layer to Ember and its object model.

  ### Modern Alternative

  Use **schemas** with `@warp-drive/core`. Modern ***Warp*Drive**:

  - defines each resource's schema as a plain object, a `ResourceSchema`, registered with the
    store's SchemaService, with no class or decorators
  - presents every resource type through one record implementation,
    [ReactiveResource](/api/@warp-drive/core/reactive/types/ReactiveResource), which reads
    its fields from the registered schema
  - shares fields across schemas with [traits](/guides/the-manual/schemas/traits), and adds
    memoized read-only fields with [derivations](/guides/the-manual/schemas/derivations) and
    value conversions with [transformations](/guides/the-manual/schemas/transformations),
    instead of inheritance
  - works in any framework ***Warp*Drive** supports, since `@warp-drive/core` has no runtime
    dependency on Ember (see [Installation](/guides/installation/))

  For guidance on migrating from Model classes to schemas, see the
  [Schemas Guide](/guides/the-manual/schemas/) and the [Migration Guide](/upgrading/v5/).

  ### Defining a Model

  ```js [app/models/person.js]
  import Model, { attr, belongsTo, hasMany } from '@warp-drive/legacy/model';

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

  @summary Legacy `Model` base class and `attr`, `belongsTo`, and `hasMany` decorators that define resource schemas
  as classes and present records.
  @module
 */
export { attr } from './model/-private/attr';
export { belongsTo } from './model/-private/belongs-to';
export { hasMany } from './model/-private/has-many';
export { Model, restoreDeprecatedModelRequestBehaviors } from './model/-private/model';
export { Model as default } from './model/-private/model';

export type { PromiseBelongsTo as AsyncBelongsTo } from './model/-private/promise-belongs-to';
export type { PromiseManyArray as AsyncHasMany } from './model/-private/promise-many-array';
export type { RelatedCollection as ManyArray } from '@warp-drive/core/store/-private';
export type { RelatedCollection as HasMany } from '@warp-drive/core/store/-private';
export { instantiateRecord, teardownRecord, modelFor } from './model/-private/hooks';
export { buildSchema } from './model/-private/schema-provider';
