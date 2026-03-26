import { describe } from 'vitest';

import { F, js, test, ts } from '../-utils/test.ts';

describe('combineSchemasAndTypes: true', function () {
  test('[TS] multiple models with relationships produce combined schema+type files', {
    config: {
      combineSchemasAndTypes: true,
    },
    input: {
      [F.tsmodel('user')]: ts`
        import Model, { attr } from '@ember-data/model';

        export default class User extends Model {
          @attr('string') name;
          @attr('string') email;
        }
      `,
      [F.tsmodel('company')]: ts`
        import Model, { attr, hasMany } from '@ember-data/model';

        export default class Company extends Model {
          @attr('string') name;
          @hasMany('user', { async: false, inverse: 'company' }) users;

          get userCount() {
            return this.users.length;
          }
        }
      `,
    },
    output: {
      [F.resource('user')]: ts`
        import { withDefaults } from '@ember-data/model/migration-support';

        import type { Type } from '@warp-drive/core-types/symbols';
        import type { WithLegacy } from '@ember-data/model/migration-support';

        const UserSchema = withDefaults({
          type: 'user',
          fields: [
            {
              kind: 'attribute',
              name: 'name',
              type: 'string'
            },
            {
              kind: 'attribute',
              name: 'email',
              type: 'string'
            }
          ]
        });

        export default UserSchema;

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
          email: string | null;
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
      [F.resource('company')]: ts`
        import { withDefaults } from '@ember-data/model/migration-support';

        import type { Type } from '@warp-drive/core-types/symbols';
        import type { WithLegacy } from '@ember-data/model/migration-support';
        import type { HasMany } from '@ember-data/model';
        import type { User } from './user.schema.ts';

        const CompanySchema = withDefaults({
          type: 'company',
          fields: [
            {
              kind: 'attribute',
              name: 'name',
              type: 'string'
            },
            {
              kind: 'hasMany',
              name: 'users',
              type: 'user',
              options: {
                async: false,
                inverse: 'company'
              }
            }
          ]
        });

        export default CompanySchema;

        /**
         * This type represents the full set schema derived fields of
         * the 'company' resource, without any of the legacy mode features
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
         * See also {@link Company} for fields + legacy mode features
         */
        export interface CompanyResource {
          readonly [Type]: 'company';
          id: string | null;
          name: string | null;
          users: HasMany<User>;
        }

        /**
         * This type represents the full set schema derived fields of
         * the 'company' resource, including all legacy mode features but
         * without any extensions.
         *
         * See also {@link CompanyResource} for just the fields
         */
        export interface Company extends WithLegacy<CompanyResource> {}
      `,
      [F.extension('company')]: ts`
        import type { Company } from './company.schema.ts';

        // @ts-ignore-error in reality fields are not merged, they are overridden
        export interface CompanyExtension extends Company {}
        export class CompanyExtension {
          get userCount() {
            return this.users.length;
          }
        }

        const Registration = {
          kind: 'object',
          name: 'company',
          features: CompanyExtension,
        };
        export default Registration;
      `,
    },
  });

  test('[JS] multiple models with relationships produce combined schema+type files', {
    config: {
      combineSchemasAndTypes: true,
    },
    input: {
      [F.jsmodel('user')]: js`
        import Model, { attr } from '@ember-data/model';

        export default class User extends Model {
          @attr('string') name;
          @attr('string') email;
        }
      `,
      [F.jsmodel('company')]: js`
        import Model, { attr, hasMany } from '@ember-data/model';

        export default class Company extends Model {
          @attr('string') name;
          @hasMany('user', { async: false, inverse: 'company' }) users;

          get userCount() {
            return this.users.length;
          }
        }
      `,
    },
    output: {
      [F.resource('user')]: ts`
        import { withDefaults } from '@ember-data/model/migration-support';

        import type { Type } from '@warp-drive/core-types/symbols';
        import type { WithLegacy } from '@ember-data/model/migration-support';

        const UserSchema = withDefaults({
          type: 'user',
          fields: [
            {
              kind: 'attribute',
              name: 'name',
              type: 'string'
            },
            {
              kind: 'attribute',
              name: 'email',
              type: 'string'
            }
          ]
        });

        export default UserSchema;

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
          email: string | null;
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
      [F.resource('company')]: ts`
        import { withDefaults } from '@ember-data/model/migration-support';

        import type { Type } from '@warp-drive/core-types/symbols';
        import type { WithLegacy } from '@ember-data/model/migration-support';
        import type { HasMany } from '@ember-data/model';
        import type { User } from './user.schema.ts';

        const CompanySchema = withDefaults({
          type: 'company',
          fields: [
            {
              kind: 'attribute',
              name: 'name',
              type: 'string'
            },
            {
              kind: 'hasMany',
              name: 'users',
              type: 'user',
              options: {
                async: false,
                inverse: 'company'
              }
            }
          ]
        });

        export default CompanySchema;

        /**
         * This type represents the full set schema derived fields of
         * the 'company' resource, without any of the legacy mode features
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
         * See also {@link Company} for fields + legacy mode features
         */
        export interface CompanyResource {
          readonly [Type]: 'company';
          id: string | null;
          name: string | null;
          users: HasMany<User>;
        }

        /**
         * This type represents the full set schema derived fields of
         * the 'company' resource, including all legacy mode features but
         * without any extensions.
         *
         * See also {@link CompanyResource} for just the fields
         */
        export interface Company extends WithLegacy<CompanyResource> {}
      `,
      [F.extension('company', 'js')]: ts`
        export class CompanyExtension {
          get userCount() {
            return this.users.length;
          }
        }

        const Registration = {
          kind: 'object',
          name: 'company',
          features: CompanyExtension,
        };
        export default Registration;
      `,
    },
  });

  test('[TS] model with belongsTo uses combined .schema imports', {
    config: {
      combineSchemasAndTypes: true,
    },
    input: {
      [F.tsmodel('post')]: ts`
        import Model, { attr, belongsTo } from '@ember-data/model';

        export default class Post extends Model {
          @attr('string') title;
          @belongsTo('user', { async: false }) author;
        }
      `,
      [F.tsmodel('user')]: ts`
        import Model, { attr } from '@ember-data/model';

        export default class User extends Model {
          @attr('string') name;
        }
      `,
    },
    output: {
      [F.resource('post')]: ts`
        import { withDefaults } from '@ember-data/model/migration-support';

        import type { Type } from '@warp-drive/core-types/symbols';
        import type { WithLegacy } from '@ember-data/model/migration-support';
        import type { User } from './user.schema.ts';

        const PostSchema = withDefaults({
          type: 'post',
          fields: [
            {
              kind: 'attribute',
              name: 'title',
              type: 'string'
            },
            {
              kind: 'belongsTo',
              name: 'author',
              type: 'user',
              options: {
                async: false,
              }
            }
          ]
        });

        export default PostSchema;

        /**
         * This type represents the full set schema derived fields of
         * the 'post' resource, without any of the legacy mode features
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
         * See also {@link Post} for fields + legacy mode features
         */
        export interface PostResource {
          readonly [Type]: 'post';
          id: string | null;
          title: string | null;
          author: User | null;
        }

        /**
         * This type represents the full set schema derived fields of
         * the 'post' resource, including all legacy mode features but
         * without any extensions.
         *
         * See also {@link PostResource} for just the fields
         */
        export interface Post extends WithLegacy<PostResource> {}
      `,
      [F.resource('user')]: ts`
        import { withDefaults } from '@ember-data/model/migration-support';

        import type { Type } from '@warp-drive/core-types/symbols';
        import type { WithLegacy } from '@ember-data/model/migration-support';

        const UserSchema = withDefaults({
          type: 'user',
          fields: [
            {
              kind: 'attribute',
              name: 'name',
              type: 'string'
            }
          ]
        });

        export default UserSchema;

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

  test('[JS] model with belongsTo uses combined .schema imports', {
    config: {
      combineSchemasAndTypes: true,
    },
    input: {
      [F.jsmodel('post')]: js`
        import Model, { attr, belongsTo } from '@ember-data/model';

        export default class Post extends Model {
          @attr('string') title;
          @belongsTo('user', { async: false }) author;
        }
      `,
      [F.jsmodel('user')]: js`
        import Model, { attr } from '@ember-data/model';

        export default class User extends Model {
          @attr('string') name;
        }
      `,
    },
    output: {
      [F.resource('post')]: ts`
        import { withDefaults } from '@ember-data/model/migration-support';

        import type { Type } from '@warp-drive/core-types/symbols';
        import type { WithLegacy } from '@ember-data/model/migration-support';
        import type { User } from './user.schema.ts';

        const PostSchema = withDefaults({
          type: 'post',
          fields: [
            {
              kind: 'attribute',
              name: 'title',
              type: 'string'
            },
            {
              kind: 'belongsTo',
              name: 'author',
              type: 'user',
              options: {
                async: false,
              }
            }
          ]
        });

        export default PostSchema;

        /**
         * This type represents the full set schema derived fields of
         * the 'post' resource, without any of the legacy mode features
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
         * See also {@link Post} for fields + legacy mode features
         */
        export interface PostResource {
          readonly [Type]: 'post';
          id: string | null;
          title: string | null;
          author: User | null;
        }

        /**
         * This type represents the full set schema derived fields of
         * the 'post' resource, including all legacy mode features but
         * without any extensions.
         *
         * See also {@link PostResource} for just the fields
         */
        export interface Post extends WithLegacy<PostResource> {}
      `,
      [F.resource('user')]: ts`
        import { withDefaults } from '@ember-data/model/migration-support';

        import type { Type } from '@warp-drive/core-types/symbols';
        import type { WithLegacy } from '@ember-data/model/migration-support';

        const UserSchema = withDefaults({
          type: 'user',
          fields: [
            {
              kind: 'attribute',
              name: 'name',
              type: 'string'
            }
          ]
        });

        export default UserSchema;

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
