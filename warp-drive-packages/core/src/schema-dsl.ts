/**
 * @module @warp-drive/core/schema-dsl
 */
export {
  // Types
  type ResourceSchema,
  type PolarisResourceSchema,
  type LegacyResourceSchema,
  type Schema,
  // Decorators
  field,
  id,
  Resource,
  type FieldOptions,
  type IdOptions,
  type ResourceOptions,
  // Compilation
  compileResourceSchema,
  compileResourceSchemas,
  type CompileOptions,
} from './schema-dsl/index.ts';
