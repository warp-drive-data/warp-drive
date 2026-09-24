/**
 * @module
 * @mergeModuleWith <project>
 * @since 5.9.0
 */

export { ObjectSchema, type ObjectSchemaOptions } from './entities/object-schema.ts';
export { Resource, type ResourceOptions } from './entities/resource.ts';
export { trait } from './entities/compose-trait.ts';
export { Trait, type TraitOptions } from './entities/trait.ts';

export { alias, type AliasOptions } from './fields/alias.ts';
export { array, type ArrayFieldOptions } from './fields/array.ts';
export { attribute, type AttributeOptions } from './fields/attribute.ts';
export { belongsTo, type BelongsToOptions } from './fields/belongs-to.ts';
export { createonly } from './fields/createonly.ts';
export { derived, type DerivedOptions } from './fields/derived.ts';
export { editonly } from './fields/editonly.ts';
export { field, type FieldOptions } from './fields/field.ts';
export { hasMany, type HasManyOptions } from './fields/has-many.ts';
export { hash, type HashOptions } from './fields/hash.ts';
export { id, type IdOptions } from './fields/id.ts';
export { local, type LocalOptions } from './fields/local.ts';
export { object, type ObjectFieldOptions } from './fields/object.ts';
export { optional } from './fields/optional.ts';
export { readonly } from './fields/readonly.ts';
export { schemaArray, type SchemaArrayOptions } from './fields/schema-array.ts';
export { schemaObject, type SchemaObjectOptions } from './fields/schema-object.ts';
