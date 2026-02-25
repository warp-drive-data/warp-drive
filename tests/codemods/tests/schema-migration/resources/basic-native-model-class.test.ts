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
          @belongsTo('entity', { async: false, inverse: null,  }) company;

          /**
           * The posts that the user has written.
           */
          @hasMany('post', { async: true, inverse: 'author', resetOnRemoteUpdate: true, polymorphic: true }) posts;
        }
      `,
    },
    output: {
      [F.resource('user')]: ts`
        import { LegacyResourceSchema } from '@warp-drive/core-types/schema/fields';

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
        } satisfies LegacyResourceSchema;

        export default UserSchema;
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
          @belongsTo('entity', { async: false, inverse: null,  }) company;

          /**
           * The posts that the user has written.
           */
          @hasMany('post', { async: true, inverse: 'author', resetOnRemoteUpdate: true, polymorphic: true }) posts;
        }
      `,
    },
    output: {
      [F.resource('user', true)]: js`
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
        };

        export default UserSchema;
      `,
    },
  });
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
        import { LegacyResourceSchema } from '@warp-drive/core-types/schema/fields';

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
        } satisfies LegacyResourceSchema;

        export default UserSchema;
      `,
      [F.resourceType('user')]: ts`
        import type { Type } from '@warp-drive/core-types/symbols';
        import type { WithLegacy } from '@ember-data/model/migration-support';
        import type { AsyncHasMany } from '@ember-data/model';
        import type { Company } from './company.type.ts';
        import type { Post } from './post.type.ts';

        interface UserFields {
          readonly [Type]: 'user';
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
         */
        export interface LegacyUser extends WithLegacy<UserFields> {}
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
        import { LegacyResourceSchema } from '@warp-drive/core-types/schema/fields';

        import type { Type } from '@warp-drive/core-types/symbols';
        import type { WithLegacy } from '@ember-data/model/migration-support';
        import type { AsyncHasMany } from '@ember-data/model';
        import type { Company } from './company.schema.ts';
        import type { Post } from './post.schema.ts';

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
        } satisfies LegacyResourceSchema;

        export default UserSchema;

        interface UserFields {
          readonly [Type]: 'user';
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
         */
        export interface LegacyUser extends WithLegacy<UserFields> {}
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
        import { LegacyResourceSchema } from '@warp-drive/core-types/schema/fields';

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
        } satisfies LegacyResourceSchema;

        export default UserSchema;
      `,
      [F.resourceType('user')]: ts`
        import type { Type } from '@warp-drive/core-types/symbols';
        import type { WithLegacy } from '@ember-data/model/migration-support';
        import type { default as AgeEnum } from '../age.ts';
        import type { Company } from './company.type.ts';

        export type UserLevels = 'admin' | 'editor' | 'viewer';

        interface UserFields {
          readonly [Type]: 'user';
          age: AgeEnum;
          level: UserLevels;
          companies: Promise<Company[]>;
        }

        export interface LegacyUser extends WithLegacy<UserFields> {}
      `,
    },
  });
});
