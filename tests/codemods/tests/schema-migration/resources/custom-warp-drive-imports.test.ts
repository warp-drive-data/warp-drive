import { describe } from 'vitest';

import { F, test, ts } from '../-utils/test.ts';

describe('custom warpDriveImports without withDefaults', function () {
  test('[TS] generates schema with legacy and identity fields inline when withDefaults is not configured', {
    config: {
      warpDriveImports: {
        Model: { imported: 'default', source: '@ember-data/model' },
        Type: { imported: 'Type', source: '@warp-drive/core-types/symbols' },
        WithLegacy: { imported: 'WithLegacy', source: '@ember-data/model/migration-support' },
        LegacyResourceSchema: { imported: 'LegacyResourceSchema', source: '@warp-drive/core-types/schema/fields' },
        LegacyTrait: { imported: 'LegacyTrait', source: '@warp-drive/core-types/schema/fields' },
      },
    },
    input: {
      [F.tsmodel('user')]: ts`
        import Model, { attr } from '@ember-data/model';
        import type { Type } from '@warp-drive/core-types/symbols';

        export default class User extends Model {
          declare readonly [Type]: 'user';
          @attr('string') declare name: string | null;
          @attr('boolean', { defaultValue: false }) declare isActive: boolean;
        }
      `,
    },
    output: {
      [F.resource('user')]: ts`
        import type { LegacyResourceSchema } from '@warp-drive/core-types/schema/fields';

        const UserSchema = {
          type: 'user',
          legacy: true,
          identity: {
            kind: '@id',
            name: 'id'
          },
          fields: [
            {
              kind: 'attribute',
              name: 'name',
              type: 'string'
            },
            {
              kind: 'attribute',
              name: 'isActive',
              type: 'boolean',
              options: {
                defaultValue: false
              }
            }
          ]
        } satisfies LegacyResourceSchema;

        export default UserSchema;
      `,
      [F.resourceType('user')]: ts`
        import type { Type } from '@warp-drive/core-types/symbols';
        import type { WithLegacy } from '@ember-data/model/migration-support';

        /**
         * This type represents the full set schema derived fields of
         * the 'user' resource, without any of the legacy mode features
         * and without any extensions.
         *
         * > [!TIP]
         * > It is likely that you will want a more specific type tailored
         * > to the context of where some data has been loaded, for instance
         * > one that marks specific fields as readonly, or which only enables
         * > some fields to be null during create, or which only includes
         * > a subset of fields based on a specific API response.
         * >
         * > For those cases, you can create a more specific type that derives
         * > from this type to ensure that your type definitions stay consistent
         * > with the schema. For more details read about {@link https://warp-drive.io/api/@warp-drive/core/types/record/type-aliases/Mask | Masking}
         *
         * See also {@link User} for fields + legacy mode features
         */
        export interface UserResource {
          readonly [Type]: 'user';
          id: string | null;
          name: string | null;
          isActive: boolean;
        }

        /**
         * This type represents the full set schema derived fields of
         * the 'user' resource, including all legacy mode features but
         * without any extensions.
         *
         * See also {@link UserResource} for just the fields
         */
        export interface User extends WithLegacy<UserResource> {}
      `,
    },
  });
});
