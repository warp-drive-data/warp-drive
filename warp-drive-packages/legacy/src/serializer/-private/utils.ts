import type { Store } from '@warp-drive/core';
import { assert } from '@warp-drive/core/build-config/macros';
import type {
  LegacyBelongsToField,
  LegacyHasManyField,
  LegacyRelationshipField,
} from '@warp-drive/core/types/schema/fields';

type Coercable = string | number | boolean | null | undefined | symbol;

export function coerceId(id: Coercable): string | null {
  if (id === null || id === undefined || id === '') {
    return null;
  } else if (typeof id === 'string') {
    return id;
  } else if (typeof id === 'symbol') {
    return id.toString();
  } else {
    return String(id);
  }
}

/**
  Given the name of a relationship on a resource `type`, determines the
  inverse relationship field (if any) using only the schema service.

  Unlike `Model.inverseFor`, this does not require `type` to be backed by
  a `Model` class, so it works for both `Model`-based and schema-only
  (e.g. `withDefaults` migration-support) resources.

  @private
*/
export function inverseForRelationship(store: Store, type: string, name: string): LegacyRelationshipField | null {
  const relationship = store.schema.fields({ type }).get(name) as
    | LegacyBelongsToField
    | LegacyHasManyField
    | undefined;
  assert(`No relationship named '${name}' on '${type}' exists.`, relationship);

  const { options } = relationship;
  assert(
    `Expected the relationship ${name} on ${type} to define an inverse.`,
    options.inverse === null || (typeof options.inverse === 'string' && options.inverse.length > 0)
  );

  if (options.inverse === null) {
    return null;
  }

  const schemaExists = store.schema.hasResource(relationship);
  assert(
    `No associated schema found for '${relationship.type}' while calculating the inverse of ${name} on ${type}`,
    schemaExists
  );

  if (!schemaExists) {
    return null;
  }

  const inverseField = store.schema.fields(relationship).get(options.inverse);
  assert(
    `No inverse relationship found for '${name}' on '${type}'`,
    inverseField && (inverseField.kind === 'belongsTo' || inverseField.kind === 'hasMany')
  );

  return (inverseField as LegacyRelationshipField) ?? null;
}

/**
  Given a relationship field on a resource `type`, determines the
  cardinality of the relationship using only the schema service.

  Unlike `Model.determineRelationshipType`, this does not require `type`
  to be backed by a `Model` class, so it works for both `Model`-based and
  schema-only (e.g. `withDefaults` migration-support) resources.

  @private
*/
export function determineRelationshipType(
  store: Store,
  type: string,
  knownSide: LegacyBelongsToField | LegacyHasManyField
): 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany' | 'oneToNone' | 'manyToNone' {
  const knownKind = knownSide.kind;
  const inverse = inverseForRelationship(store, type, knownSide.name);

  if (!inverse) {
    return knownKind === 'belongsTo' ? 'oneToNone' : 'manyToNone';
  }

  const otherKind = inverse.kind;

  if (otherKind === 'belongsTo') {
    return knownKind === 'belongsTo' ? 'oneToOne' : 'manyToOne';
  } else {
    return knownKind === 'belongsTo' ? 'oneToMany' : 'manyToMany';
  }
}
