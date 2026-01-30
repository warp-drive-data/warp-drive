/**
 * # Schema DSL
 *
 * A TypeScript-based compile-time DSL for producing JSON resource schemas.
 *
 * This module provides decorators and utilities for defining resource schemas
 * using TypeScript classes, which are then compiled to the canonical JSON schema
 * format used by WarpDrive's SchemaService.
 *
 * ## Quick Start
 *
 * ```ts
 * import { Resource, field, compileResourceSchemas } from '@warp-drive/core/schema-dsl';
 *
 * @Resource
 * class User {
 *   @field declare firstName: string;
 *   @field declare lastName: string;
 *   @field declare email: string;
 * }
 *
 * // Compile to canonical schema and register
 * const schemas = compileResourceSchemas([User]);
 * store.schema.registerResources(schemas);
 * ```
 *
 * ## Why a DSL?
 *
 * The canonical JSON schema format is powerful but verbose. The DSL provides:
 *
 * - **Familiar Syntax**: Define schemas using TypeScript classes and decorators
 * - **Type Safety**: TypeScript validates your schema definitions
 * - **IDE Support**: Autocomplete and refactoring work naturally
 * - **Composability**: Class inheritance and traits for schema reuse
 *
 * The DSL compiles to the same JSON schemas you would write by hand, so the
 * runtime behavior is identical.
 *
 * ## Decorators
 *
 * - {@link Resource} - Mark a class as a resource schema
 * - {@link field} - Mark a property as a primitive field
 * - {@link id} - Mark a property as the identity field
 *
 * ## Compilation
 *
 * - {@link compileResourceSchema} - Compile a single class to ResourceSchema
 * - {@link compileResourceSchemas} - Compile multiple classes
 *
 * @module
 */

// Canonical schema types (for typing compiled output and record shapes)
export type { ResourceSchema, PolarisResourceSchema, LegacyResourceSchema, Schema } from '../types/schema/fields.ts';

// Decorators
export { field, id, Resource, type FieldOptions, type IdOptions, type ResourceOptions } from './-private/decorators.ts';

// Compilation
export { compileResourceSchema, compileResourceSchemas, type CompileOptions } from './-private/compile.ts';
