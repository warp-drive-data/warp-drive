/**
 * @module @warp-drive/core/schema-dsl
 */

export type { ResourceSchema, PolarisResourceSchema, LegacyResourceSchema, Schema } from '../types/schema/fields.ts';

export { field, id, Resource, type FieldOptions, type IdOptions, type ResourceOptions } from './-private/decorators.ts';

export { compileResourceSchema, compileResourceSchemas, type CompileOptions } from './-private/compile.ts';
