/**
 * @summary Legacy entry re-exporting the class-based `Model`, its `attr`, `belongsTo`, and `hasMany` decorators, and
 * the store hooks that use `Model` classes as schemas.
 * @module
 * @mergeModuleWith <project>
 */
export {
  default,
  attr,
  belongsTo,
  hasMany,
  instantiateRecord,
  teardownRecord,
  modelFor,
  buildSchema,
  type ManyArray,
  type HasMany,
  type AsyncHasMany,
  type AsyncBelongsTo,
} from '@warp-drive/legacy/model';
