import type { LegacyResourceSchema, ResourceSchema } from '@warp-drive/core/types/schema/fields';
import type { WithPartial } from '@warp-drive/core/types/utils';

import { withDefaults } from '../../model/migration-support';

/**
 * Used as a helper to setup the relevant parts of a legacy resource schema
 * migrated from `Model`, applying the `ember-object` and `fragment` object
 * extensions and a default `@id` identity field.
 *
 * @param schema the partial legacy resource schema to complete
 * @returns the completed resource schema
 */
export function withLegacy(schema: WithPartial<LegacyResourceSchema, 'legacy' | 'identity'>): ResourceSchema {
  return withDefaults({
    ...schema,
    identity: { kind: '@id', name: 'id' },
    objectExtensions: ['ember-object', 'fragment'],
  });
}
