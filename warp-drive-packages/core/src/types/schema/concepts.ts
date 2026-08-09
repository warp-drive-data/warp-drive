import type { ResourceKey } from '../identifier.ts';
import type { ObjectValue, Value } from '../json/raw.ts';
import type { OpaqueRecordInstance } from '../record.ts';
import type { Type } from '../symbols.ts';

/**
 * A Transformation converts a cached primitive value into a richer
 * "presentation" value exposed on a record, and back again.
 *
 * Transformations are used by {@link GenericField}, {@link ObjectField}
 * and {@link ArrayField} to convert between the raw value stored in the
 * cache (`T`) and the value read from or written to a record (`PT`).
 *
 * Transformations must be registered with the SchemaService via
 * `schema.registerTransformation(transform)` before use, keyed by the
 * name assigned to their {@link Type} property.
 */
export type Transformation<T extends Value = Value, PT = unknown> = {
  /**
   * Converts a value from its presentation form (as read from or written
   * to a record) into the raw form to be stored in the cache.
   */
  serialize(value: PT, options: ObjectValue | null, record: OpaqueRecordInstance): T;

  /**
   * Converts a value from its raw cached form into the presentation
   * form exposed on a record.
   */
  hydrate(value: T | undefined, options: ObjectValue | null, record: OpaqueRecordInstance): PT;

  /**
   * Computes the value to use when no value is present in the cache
   * for the field.
   */
  defaultValue?(options: ObjectValue | null, identifier: ResourceKey): T;

  /**
   * The unique name this transformation is registered under.
   */
  [Type]: string;
};

/**
 * A Derivation computes a read-only field value from other fields
 * (and options) on a record.
 *
 * Derivations back {@link DerivedField}. They are memoized and only
 * recomputed when the fields they read change; derived values are never
 * stored in the cache nor sent to the server.
 *
 * Derivations must be registered with the SchemaService via
 * `schema.registerDerivation(derivation)` before use, keyed by the
 * name assigned to their {@link Type} property.
 */
export type Derivation<R = unknown, T = unknown, FM extends ObjectValue | null = ObjectValue | null> = {
  /**
   * The unique name this derivation is registered under.
   */
  [Type]: string;
} & ((record: R, options: FM, prop: string) => T);

/**
 * A HashFn computes a stable string identity for an object from its
 * cache data, without access to a record instance.
 *
 * HashFns back {@link HashField}, and are used to compute the `@hash`
 * identity of a schema-object, or to determine the resource type of a
 * polymorphic schema-object or schema-array member.
 *
 * HashFns must be registered with the SchemaService via
 * `schema.registerHashFn(hashFn)` before use, keyed by the name
 * assigned to their {@link Type} property.
 */
export type HashFn<T extends object = object> = {
  /**
   * The unique name this hash function is registered under.
   */
  [Type]: string;
} & ((data: T, options: ObjectValue | null, prop: string | null) => string);
