import { describe } from 'vitest';

import { F, js, test, ts } from '../-utils/test.ts';

describe('model used as base class via .extend()', function () {
  test('model extending an import substitute produces trait artifacts', {
    config: {
      importSubstitutes: [
        {
          import: 'test-app/client-core/core/-another-base-model',
          trait: 'another-base-model',
        },
      ],
    },
    input: {
      [F.tsmodel('base-model')]: ts`
        import AnotherBaseModel from 'test-app/client-core/core/-another-base-model';
        import { attr } from '@ember-data/model';

        export default class BaseModel extends AnotherBaseModel {
          @attr('string') declare description: string;
        }
      `,
      [F.jsmodel('user')]: js`
        import Model, { attr } from '@ember-data/model';
        import BaseModel from '../models/base-model';

        export default class User extends Model.extend(BaseModel) {
          @attr('string') name;
        }
      `,
    },
    output: {
      [F.resource('base-model')]: ts`
        import type { LegacyTrait } from '@warp-drive/core-types/schema/fields';

        const BaseModelTraitSchema = {
          name: 'base-model',
          mode: 'legacy',
          fields: [
            {
              kind: 'attribute',
              name: 'description',
              type: 'string',
            },
          ],
          traits: ['another-base-model'],
        } satisfies LegacyTrait;

        export default BaseModelTraitSchema;
      `,
      [F.resourceType('base-model')]: ts`
        import type { BelongsToReference, HasManyReference, Errors } from '@warp-drive/legacy/model/-private';
        import type { AnotherBaseModelTrait } from '../traits/another-base-model.type';

        /**
         * This type represents the full set schema derived fields of
         * the 'base-model' trait, without any of the legacy mode features
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
         */
        export interface BaseModelTrait extends AnotherBaseModelTrait {
          id: string | null;
          description: string;
        }
      `,
      [F.resource('user')]: ts`
        import { withDefaults } from '@ember-data/model/migration-support';

        const UserSchema = withDefaults({
          type: 'user',
          fields: [
            {
              kind: 'attribute',
              name: 'name',
              type: 'string',
            },
          ],
          traits: ['base-model'],
        });

        export default UserSchema;
      `,
      [F.resourceType('user')]: ts`
        import type { Type } from '@warp-drive/core-types/symbols';
        import type { WithLegacy } from '@ember-data/model/migration-support';
        import type { BaseModelTrait } from '../traits/base-model.type';

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
        export interface UserResource extends BaseModelTrait {
          readonly [Type]: 'user';
          id: string | null;
          name: string | null;
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
