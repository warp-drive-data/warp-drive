import { describe } from 'vitest';

import { F, js, test, ts } from '../-utils/test.ts';

describe('forceTypeScript option', function () {
  test('[JS → TS] forceTypeScript produces TypeScript extension from JavaScript input', {
    config: {
      forceTypeScript: true,
    },
    input: {
      [F.jsmodel('user')]: js`
        import { cached, tracked } from '@glimmer/tracking';
        import Model, { attr, belongsTo, hasMany } from '@ember-data/model';

        export const BIRTHAGE = 0;

        /**
         * A user of the application.
         */
        export default class User extends Model {
          @tracked randomProp = 'hello';
          /**
           * The first name of the user.
           */
          @attr firstName;
          @attr('string') lastName;
          @attr('number', { defaultValue: BIRTHAGE }) age;

          @cached
          get fullName() {
            return this.firstName + ' ' + this.lastName;
          }

          getAge() {
            return this.fullName + ' is ' + this.age;
          }

          /**
           * The company the user works for
           */
          @belongsTo('company', { async: false, inverse: null }) company;

          /**
           * The posts that the user has written.
           */
          @hasMany('post', { async: true, inverse: 'author' }) posts;
        }
      `,
    },
    output: {
      [F.resource('user')]: ts`
        import { withDefaults } from '@ember-data/model/migration-support';

        export const BIRTHAGE = 0;

        const UserSchema = withDefaults({
          type: 'user',
          fields: [
            {
              kind: 'attribute',
              name: 'firstName'
            },
            {
              kind: 'attribute',
              name: 'lastName',
              type: 'string'
            },
            {
              kind: 'attribute',
              name: 'age',
              type: 'number',
              options: {
                defaultValue: BIRTHAGE
              }
            },
            {
              kind: 'belongsTo',
              name: 'company',
              type: 'company',
              options: {
                async: false,
                inverse: null
              }
            },
            {
              kind: 'hasMany',
              name: 'posts',
              type: 'post',
              options: {
                async: true,
                inverse: 'author'
              }
            }
          ]
        });

        export default UserSchema;
      `,
      [F.resourceType('user')]: ts`
        import type { Type } from '@warp-drive/core-types/symbols';
        import type { WithLegacy } from '@ember-data/model/migration-support';
        import type { AsyncHasMany } from '@ember-data/model';
        import type { Company } from './company.type.ts';
        import type { Post } from './post.type.ts';

        /**
         * A user of the application.
         *
         * ---
         *
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

          /**
           * The first name of the user.
           */
          firstName: unknown;
          lastName: string | null;
          age: number;

          /**
           * The company the user works for
           */
          company: Company | null;

          /**
           * The posts that the user has written.
           */
          posts: AsyncHasMany<Post>;
        }

        /**
         * A user of the application.
         *
         * ---
         *
         * This type represents the full set schema derived fields of
         * the 'user' resource, including all legacy mode features but
         * without any extensions.
         *
         * See also {@link UserResource} for just the fields
         */
        export interface User extends WithLegacy<UserResource> {}
      `,
      [F.extension('user')]: ts`
        import { cached, tracked } from '@glimmer/tracking';
        import type { User } from './user.type.ts';

        export const BIRTHAGE = 0;

        /**
         * A user of the application.
         */
        // @ts-ignore-error in reality fields are not merged, they are overridden
        export interface UserExtension extends User {}
        export class UserExtension {
          @tracked randomProp = 'hello';

          @cached
          get fullName() {
            return this.firstName + ' ' + this.lastName;
          }

          getAge() {
            return this.fullName + ' is ' + this.age;
          }
        }

        const Registration = {
          kind: 'object',
          name: 'user',
          features: UserExtension,
        };
        export default Registration;
      `,
    },
  });
  test('[JS → TS] forceTypeScript produces TypeScript output for model without extension', {
    config: {
      forceTypeScript: true,
    },
    input: {
      [F.jsmodel('user')]: js`
        import Model, { attr, belongsTo } from '@ember-data/model';

        export default class User extends Model {
          @attr firstName;
          @attr('string') lastName;

          @belongsTo('company', { async: false, inverse: null }) company;
        }
      `,
    },
    output: {
      [F.resource('user')]: ts`
        import { withDefaults } from '@ember-data/model/migration-support';

        const UserSchema = withDefaults({
          type: 'user',
          fields: [
            {
              kind: 'attribute',
              name: 'firstName'
            },
            {
              kind: 'attribute',
              name: 'lastName',
              type: 'string'
            },
            {
              kind: 'belongsTo',
              name: 'company',
              type: 'company',
              options: {
                async: false,
                inverse: null
              }
            }
          ]
        });

        export default UserSchema;
      `,
      [F.resourceType('user')]: ts`
        import type { Type } from '@warp-drive/core-types/symbols';
        import type { WithLegacy } from '@ember-data/model/migration-support';
        import type { Company } from './company.type.ts';

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
          firstName: unknown;
          lastName: string | null;
          company: Company | null;
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
