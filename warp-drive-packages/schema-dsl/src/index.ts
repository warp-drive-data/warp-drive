/**
 * @module @warp-drive/schema-dsl
 */

import type { SchemaService } from '@warp-drive/core/types/schema/schema-service';

import { compileResourceSchema } from './-private/compile.ts';

// Decorators
export { field, id, Resource, type FieldOptions, type IdOptions, type ResourceOptions } from './-private/decorators.ts';

/**
 * Registers DSL-decorated classes with the store's schema service.
 *
 * @example
 * ```ts
 * import { Resource, field, registerSchemas } from '@warp-drive/schema-dsl';
 *
 * @Resource
 * class User {
 *   @field declare firstName: string;
 *   @field declare lastName: string;
 * }
 *
 * @Resource
 * class Post {
 *   @field declare title: string;
 * }
 *
 * registerSchemas(store.schema, [User, Post]);
 * ```
 */
export function registerSchemas(schema: SchemaService, classes: Array<new (...args: unknown[]) => object>): void {
  const schemas = classes.map((cls) => compileResourceSchema(cls));
  schema.registerResources(schemas);
}
