import { describe } from 'vitest';

import { F, js, test, ts } from '../-utils/test.ts';

describe('Basic model class transformation', function () {
  test('[JS] We can transform basic native class models', {
    input: {
      [F.jsmodel('user')]: js`
        import Model, { attr, belongsTo, hasMany } from '@ember-data/model';

        /**
         * A user of the application.
         */
        export default class User extends Model {
          /**
           * The first name of the user.
           */
          @attr firstName;
          @attr('string') lastName;
          @attr('number', { defaultValue: 0 }) age;

          /**
           * The company the user works for
           */
          @belongsTo('company', { async: false, inverse: null,  }) company;

          /**
           * The posts that the user has written.
           */
          @hasMany('post', { async: true, inverse: 'author', resetOnRemoteUpdate: true, polymorphic: true }) posts;
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
              kind: 'attribute',
              name: 'age',
              type: 'number',
              options: {
                defaultValue: 0
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
                inverse: 'author',
                resetOnRemoteUpdate: true,
                polymorphic: true
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
    },
  });
  test('[JS] We can transform basic native class models (disableTypescriptSchemas: true)', {
    config: {
      disableTypescriptSchemas: true,
    },
    input: {
      [F.jsmodel('user')]: js`
        import Model, { attr, belongsTo, hasMany } from '@ember-data/model';

        /**
         * A user of the application.
         */
        export default class User extends Model {
          /**
           * The first name of the user.
           */
          @attr firstName;
          @attr('string') lastName;
          @attr('number', { defaultValue: 0 }) age;

          /**
           * The company the user works for
           */
          @belongsTo('company', { async: false, inverse: null,  }) company;

          /**
           * The posts that the user has written.
           */
          @hasMany('post', { async: true, inverse: 'author', resetOnRemoteUpdate: true, polymorphic: true }) posts;
        }
      `,
    },
    output: {
      [F.resource('user', 'js')]: js`
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
              kind: 'attribute',
              name: 'age',
              type: 'number',
              options: {
                defaultValue: 0
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
                inverse: 'author',
                resetOnRemoteUpdate: true,
                polymorphic: true
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
    },
  });
  test(
    '[JS] We can transform basic native class models (disableTypescriptSchemas: true, disableMissingTypeAutoGen: true)',
    {
      config: {
        disableTypescriptSchemas: true,
        disableMissingTypeAutoGen: true,
      },
      input: {
        [F.jsmodel('user')]: js`
        import Model, { attr, belongsTo, hasMany } from '@ember-data/model';

        /**
         * A user of the application.
         */
        export default class User extends Model {
          /**
           * The first name of the user.
           */
          @attr firstName;
          @attr('string') lastName;
          @attr('number', { defaultValue: 0 }) age;

          /**
           * The company the user works for
           */
          @belongsTo('entity', { async: false, inverse: null,  }) company;

          /**
           * The posts that the user has written.
           */
          @hasMany('post', { async: true, inverse: 'author', resetOnRemoteUpdate: true, polymorphic: true }) posts;
        }
      `,
      },
      output: {
        [F.resource('user', 'js')]: js`
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
              kind: 'attribute',
              name: 'age',
              type: 'number',
              options: {
                defaultValue: 0
              }
            },
            {
              kind: 'belongsTo',
              name: 'company',
              type: 'entity',
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
                inverse: 'author',
                resetOnRemoteUpdate: true,
                polymorphic: true
              }
            }
          ]
        });

        export default UserSchema;
      `,
      },
    }
  );
  test('[TS] We can transform basic native class models', {
    input: {
      [F.tsmodel('user')]: ts`
        import Model, { attr, belongsTo, hasMany, type AsyncHasMany } from '@ember-data/model';
        import type { Type } from '@warp-drive/core-types/symbols'
        import type Company from './company.ts';
        import type Post from './post.ts';

        /**
         * A user of the application.
         */
        export default class User extends Model {
          declare readonly [Type]: 'user';
          /**
           * The first name of the user.
           */
          @attr declare firstName: string | null;
          @attr('string') declare lastName: string;
          @attr('integer', { defaultValue: 0 }) declare age: number;

          /**
           * The company the user works for
           */
          @belongsTo('company', { async: false, inverse: null }) company!: Company;

          /**
           * The formerCompany
           */
          @belongsTo('company', { async: false, inverse: null }) formerCompany!: Company | null;

          /**
           * The posts that the user has written.
           */
          @hasMany('post', { async: true, inverse: 'author', resetOnRemoteUpdate: true, polymorphic: true }) posts!: AsyncHasMany<Post>;
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
              kind: 'attribute',
              name: 'age',
              type: 'integer',
              options: {
                defaultValue: 0
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
              kind: 'belongsTo',
              name: 'formerCompany',
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
                inverse: 'author',
                resetOnRemoteUpdate: true,
                polymorphic: true
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
          firstName: string | null;
          lastName: string;
          age: number;

          /**
           * The company the user works for
           */
          company: Company;

          /**
           * The formerCompany
           */
          formerCompany: Company | null;

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
    },
  });
  test('[TS] We can transform basic native class models (combineSchemasAndTypes: true)', {
    config: {
      combineSchemasAndTypes: true,
    },
    input: {
      [F.tsmodel('user')]: ts`
        import Model, { attr, belongsTo, hasMany, type AsyncHasMany } from '@ember-data/model';
        import type { Type } from '@warp-drive/core-types/symbols'
        import type Company from './company.ts';
        import type Post from './post.ts';

        /**
         * A user of the application.
         */
        export default class User extends Model {
          declare readonly [Type]: 'user';
          /**
           * The first name of the user.
           */
          @attr declare firstName: string | null;
          @attr('string') declare lastName: string;
          @attr('integer', { defaultValue: 0 }) declare age: number;

          /**
           * The company the user works for
           */
          @belongsTo('company', { async: false, inverse: null }) company!: Company;

          /**
           * The formerCompany
           */
          @belongsTo('company', { async: false, inverse: null }) formerCompany!: Company | null;

          /**
           * The posts that the user has written.
           */
          @hasMany('post', { async: true, inverse: 'author', resetOnRemoteUpdate: true, polymorphic: true }) posts!: AsyncHasMany<Post>;
        }
      `,
    },
    output: {
      [F.resource('user')]: ts`
        import { withDefaults } from '@ember-data/model/migration-support';

        import type { Type } from '@warp-drive/core-types/symbols';
        import type { WithLegacy } from '@ember-data/model/migration-support';
        import type { AsyncHasMany } from '@ember-data/model';
        import type { Company } from './company.schema.ts';
        import type { Post } from './post.schema.ts';

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
              type: 'integer',
              options: {
                defaultValue: 0
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
              kind: 'belongsTo',
              name: 'formerCompany',
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
                inverse: 'author',
                resetOnRemoteUpdate: true,
                polymorphic: true
              }
            }
          ]
        });

        export default UserSchema;

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
          firstName: string | null;
          lastName: string;
          age: number;

          /**
           * The company the user works for
           */
          company: Company;

          /**
           * The formerCompany
           */
          formerCompany: Company | null;

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
    },
  });
  test('[TS] We preserve advanced types', {
    input: {
      [F.tsmodel('user')]: ts`
        import Model, { attr, hasMany } from '@ember-data/model';
        import type { Type } from '@warp-drive/core-types/symbols'
        import type Company from './company.ts';
        import type AgeEnum from '../age.ts';

        export type UserLevels = 'admin' | 'editor' | 'viewer';

        export default class User extends Model {
          declare readonly [Type]: 'user';
          @attr('integer', { defaultValue: 0 }) declare age: AgeEnum;
          @attr declare level: UserLevels;

          @hasMany('company', { async: true, inverse: 'employees' }) companies!: Promise<Company[]>;
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
              name: 'age',
              type: 'integer',
              options: {
                defaultValue: 0
              }
            },
            {
              kind: 'attribute',
              name: 'level',
            },
            {
              kind: 'hasMany',
              name: 'companies',
              type: 'company',
              options: {
                async: true,
                inverse: 'employees'
              }
            }
          ]
        });

        export default UserSchema;
      `,
      [F.resourceType('user')]: ts`
        import type { Type } from '@warp-drive/core-types/symbols';
        import type { WithLegacy } from '@ember-data/model/migration-support';
        import type { default as AgeEnum } from '../age.ts';
        import type { Company } from './company.type.ts';

        export type UserLevels = 'admin' | 'editor' | 'viewer';

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
          age: AgeEnum;
          level: UserLevels;
          companies: Promise<Company[]>;
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
