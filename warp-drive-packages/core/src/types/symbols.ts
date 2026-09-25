// oxlint-disable-next-line no-unused-vars
import type { Store } from '../store/-private/store-service.ts';
import { getOrSetGlobal } from './-private.ts';

/**
 * Symbol used internally to stash a reference to the owning
 * {@link Store} on a record instance.
 *
 * @summary Internal symbol key under which a record instance keeps a reference to the store that owns it.
 * @type {Symbol}
 */
export const RecordStore: '___(unique) Symbol(Store)' = getOrSetGlobal('Store', Symbol('Store'));

/**
 * Symbol for the name of a resource, transformation
 * or derivation.
 *
 * ### With Resources
 *
 * This is an optional feature that can be used by
 * record implementations to provide a typescript
 * hint for the type of the resource.
 *
 * When used, WarpDrive APIs can
 * take advantage of this to provide better type
 * safety and intellisense.
 *
 * ### With Derivations
 *
 * Required for derivations registered with
 * `store.registerDerivation(derivation)`.
 *
 * ```ts
 * function concat(record: object, options: ObjectValue | null, prop: string): string {}
 * concat[Name] = 'concat';
 * ```
 *
 * ### With Transforms
 *
 * Required for new-style transformations registered
 * with `store.registerTransform(transform)`.
 *
 * For legacy transforms, if not used,
 * `attr<Transform>('name')` will allow any string name.
 * `attr('name')` will always allow any string name.
 *
 * If used, `attr<Transform>('name')` will enforce
 * that the name is the same as the transform name.
 *
 * @summary Symbol key that brands a record with its resource type for TypeScript, and names a derivation or
 * transformation when it is registered.
 * @type {Symbol}
 */
export const Type: '___(unique) Symbol($type)' = getOrSetGlobal('$type', Symbol('$type'));

/**
 * Symbol for the type of a resource.
 *
 * This is an optional feature that can be used by
 * record implementations to provide a typescript
 * hint for the type of the resource.
 *
 * When used, WarpDrive APIs can
 * take advantage of this to provide better type
 * safety and intellisense.
 *
 * @summary Alias of the `Type` symbol that a record type can declare to tell WarpDrive APIs its resource type for
 * better type inference.
 * @type {Symbol}
 */
export const ResourceType: '___(unique) Symbol($type)' = Type;

/**
 * Symbol for the name of a transform.
 *
 * This is an optional feature that can be used by
 * transform implementations to provide a typescript
 * hint for the name of the transform.
 *
 * If not used, `attr<Transform>('name')` will
 * allow any string name. `attr('name')` will always
 * allow any string name.
 *
 * If used, `attr<Transform>('name')` will enforce
 * that the name is the same as the transform name.
 *
 * @summary Alias of the `Type` symbol that a legacy transform can declare so `attr<Transform>('name')` checks the
 * transform name at the type level.
 * @type {Symbol}
 */
export const TransformName: '___(unique) Symbol($type)' = Type;

/**
 * Symbol for use by builders to indicate the return type
 * generic to use for store.request()
 *
 * @summary Type-only symbol key that request builders set on the request they return so `store.request()` can
 * infer the response type.
 * @type {Symbol}
 */
export const RequestSignature: '___(unique) Symbol(RequestSignature)' = getOrSetGlobal(
  'RequestSignature',
  Symbol('RequestSignature')
);
