import { describe } from 'vitest';

import { F, test, ts } from '../-utils/test.ts';

describe('Duplicate model imports in relationship type annotations', function () {
  test('[TS] typed belongsTo with model import should not duplicate import in type file', {
    input: {
      [F.tsmodel('user')]: ts`
        import Model, { attr, belongsTo } from '@ember-data/model';
        import type Company from 'test-app/models/company';

        export default class User extends Model {
          @attr declare name: string;
          @belongsTo('company', { async: false, inverse: null }) declare company: Company;
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
              name: 'name'
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
          name: string;
          company: Company;
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

  test('[TS] typed belongsTo with custom modelImportSource should not duplicate import in type file', {
    config: {
      emberDataImportSource: '@test-lib/warp-drive/v1/model',
      modelImportSource: '@test-lib/warp-drive/v1/model',
    },
    input: {
      [F.tsmodel('user')]: ts`
        import Model, { attr, belongsTo } from '@test-lib/warp-drive/v1/model';
        import type Company from 'test-app/models/company';

        export default class User extends Model {
          @attr declare name: string;
          @belongsTo('company', { async: false, inverse: null }) declare company: Company;
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
              name: 'name'
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
          name: string;
          company: Company;
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

  test('[TS] model imports on attr type declaration are preserved when no relationship generates a resource import', {
    input: {
      [F.tsmodel('timesheet-project')]: ts`
        import Model, { attr } from '@ember-data/model';

        export default class TimesheetProject extends Model {
          @attr declare title: string;
        }
      `,
      [F.tsmodel('timesheetable')]: ts`
        import Model, { attr } from '@ember-data/model';
        import type TimesheetProject from 'test-app/models/timesheet-project';
        import type Region from 'test-app/models/region';

        export type TimesheetableModels = TimesheetProject | Region;

        export default class Timesheetable extends Model {
          @attr declare meta: TimesheetableModels;
        }
      `,
    },
    output: {
      [F.resource('timesheet-project')]: ts`
        import { withDefaults } from '@ember-data/model/migration-support';

        const TimesheetProjectSchema = withDefaults({
          type: 'timesheet-project',
          fields: [
            {
              kind: 'attribute',
              name: 'title'
            }
          ]
        });

        export default TimesheetProjectSchema;
      `,
      [F.resourceType('timesheet-project')]: ts`
        import type { Type } from '@warp-drive/core-types/symbols';
        import type { WithLegacy } from '@ember-data/model/migration-support';

        /**
         * This type represents the full set schema derived fields of
         * the 'timesheet-project' resource, without any of the legacy mode features
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
         * See also {@link TimesheetProject} for fields + legacy mode features
         */
        export interface TimesheetProjectResource {
          readonly [Type]: 'timesheet-project';
          id: string | null;
          title: string;
        }

        /**
         * This type represents the full set schema derived fields of
         * the 'timesheet-project' resource, including all legacy mode features but
         * without any extensions.
         *
         * See also {@link TimesheetProjectResource} for just the fields
         */
        export interface TimesheetProject extends WithLegacy<TimesheetProjectResource> {}
      `,
      [F.resource('timesheetable')]: ts`
        import { withDefaults } from '@ember-data/model/migration-support';

        const TimesheetableSchema = withDefaults({
          type: 'timesheetable',
          fields: [
            {
              kind: 'attribute',
              name: 'meta'
            }
          ]
        });

        export default TimesheetableSchema;
      `,
      [F.resourceType('timesheetable')]: ts`
        import type { Type } from '@warp-drive/core-types/symbols';
        import type { WithLegacy } from '@ember-data/model/migration-support';
        import type { default as TimesheetProject } from 'test-app/models/timesheet-project';
        import type { default as Region } from 'test-app/models/region';

        export type TimesheetableModels = TimesheetProject | Region;

        /**
         * This type represents the full set schema derived fields of
         * the 'timesheetable' resource, without any of the legacy mode features
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
         * See also {@link Timesheetable} for fields + legacy mode features
         */
        export interface TimesheetableResource {
          readonly [Type]: 'timesheetable';
          id: string | null;
          meta: TimesheetableModels;
        }

        /**
         * This type represents the full set schema derived fields of
         * the 'timesheetable' resource, including all legacy mode features but
         * without any extensions.
         *
         * See also {@link TimesheetableResource} for just the fields
         */
        export interface Timesheetable extends WithLegacy<TimesheetableResource> {}
      `,
    },
  });

  test('[TS] model import for unmigrated related type is preserved when field type declaration references it', {
    input: {
      [F.tsmodel('user')]: ts`
        import Model, { attr, belongsTo } from '@ember-data/model';
        import type Company from 'test-app/models/company';
        import type Region from 'test-app/models/region';

        export type CompanyTypes = Company | Region;

        export default class User extends Model {
          @attr declare name: string;
          @belongsTo('company', { async: false, inverse: null }) declare company: CompanyTypes;
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
              name: 'name'
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
        import type { default as Region } from 'test-app/models/region';
        import type { Company } from './company.type.ts';

        export type CompanyTypes = Company | Region;

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
          name: string;
          company: CompanyTypes;
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

describe('Type declarations in model files', function () {
  test('[TS] Interface used as field type should appear in type file', {
    input: {
      [F.tsmodel('user')]: ts`
        import Model, { attr, belongsTo } from '@ember-data/model';

        export interface UserMeta {
          region: string;
          budget: number;
        }

        export default class User extends Model {
          @attr() declare meta: UserMeta;
          @attr declare firstName: string;
          @belongsTo('company', { async: false, inverse: null }) declare company;

          formatMeta() {
            return JSON.stringify(this.meta);
          }
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
              name: 'meta'
            },
            {
              kind: 'attribute',
              name: 'firstName'
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

        export interface UserMeta {
          region: string;
          budget: number;
        }

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
          meta: UserMeta;
          firstName: string;
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
      [F.extension('user')]: ts`
        import type { User } from './user.type.ts';

        // @ts-ignore-error in reality fields are not merged, they are overridden
        export interface UserExtension extends User {}
        export class UserExtension {
          formatMeta() {
            return JSON.stringify(this.meta);
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

  test('[TS] Type alias with imported dependency should have correct imports in type file', {
    input: {
      [F.tsmodel('timesheetable')]: ts`
        import Model, { attr } from '@ember-data/model';
        import type { MetaRegion } from 'some-package/meta-region';

        export type TimesheetableMeta = {
          region: MetaRegion;
        };

        export default class Timesheetable extends Model {
          @attr() declare meta: TimesheetableMeta;
          @attr declare name: string;

          formatMeta() {
            return JSON.stringify(this.meta);
          }
        }
      `,
    },
    output: {
      [F.resource('timesheetable')]: ts`
        import { withDefaults } from '@ember-data/model/migration-support';

        const TimesheetableSchema = withDefaults({
          type: 'timesheetable',
          fields: [
            {
              kind: 'attribute',
              name: 'meta'
            },
            {
              kind: 'attribute',
              name: 'name'
            }
          ]
        });

        export default TimesheetableSchema;
      `,
      [F.resourceType('timesheetable')]: ts`
        import type { Type } from '@warp-drive/core-types/symbols';
        import type { WithLegacy } from '@ember-data/model/migration-support';
        import type { MetaRegion } from 'some-package/meta-region';

        export type TimesheetableMeta = {
          region: MetaRegion;
        };

        /**
         * This type represents the full set schema derived fields of
         * the 'timesheetable' resource, without any of the legacy mode features
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
         * See also {@link Timesheetable} for fields + legacy mode features
         */
        export interface TimesheetableResource {
          readonly [Type]: 'timesheetable';
          id: string | null;
          meta: TimesheetableMeta;
          name: string;
        }

        /**
         * This type represents the full set schema derived fields of
         * the 'timesheetable' resource, including all legacy mode features but
         * without any extensions.
         *
         * See also {@link TimesheetableResource} for just the fields
         */
        export interface Timesheetable extends WithLegacy<TimesheetableResource> {}
      `,
      [F.extension('timesheetable')]: ts`
        import type { Timesheetable } from './timesheetable.type.ts';

        // @ts-ignore-error in reality fields are not merged, they are overridden
        export interface TimesheetableExtension extends Timesheetable {}
        export class TimesheetableExtension {
          formatMeta() {
            return JSON.stringify(this.meta);
          }
        }

        const Registration = {
          kind: 'object',
          name: 'timesheetable',
          features: TimesheetableExtension,
        };
        export default Registration;
      `,
    },
  });

  test('[TS] Type alias with relative import dependency preserves correct path in type file', {
    input: {
      [F.tsmodel('timesheetable')]: ts`
        import Model, { attr } from '@ember-data/model';
        import type { MetaRegion } from './meta-region';

        export type TimesheetableMeta = {
          region: MetaRegion;
        };

        export default class Timesheetable extends Model {
          @attr() declare meta: TimesheetableMeta;
          @attr declare name: string;

          formatMeta() {
            return JSON.stringify(this.meta);
          }
        }
      `,
    },
    output: {
      [F.resource('timesheetable')]: ts`
        import { withDefaults } from '@ember-data/model/migration-support';

        const TimesheetableSchema = withDefaults({
          type: 'timesheetable',
          fields: [
            {
              kind: 'attribute',
              name: 'meta'
            },
            {
              kind: 'attribute',
              name: 'name'
            }
          ]
        });

        export default TimesheetableSchema;
      `,
      [F.resourceType('timesheetable')]: ts`
        import type { Type } from '@warp-drive/core-types/symbols';
        import type { WithLegacy } from '@ember-data/model/migration-support';
        import type { MetaRegion } from './meta-region';

        export type TimesheetableMeta = {
          region: MetaRegion;
        };

        /**
         * This type represents the full set schema derived fields of
         * the 'timesheetable' resource, without any of the legacy mode features
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
         * See also {@link Timesheetable} for fields + legacy mode features
         */
        export interface TimesheetableResource {
          readonly [Type]: 'timesheetable';
          id: string | null;
          meta: TimesheetableMeta;
          name: string;
        }

        /**
         * This type represents the full set schema derived fields of
         * the 'timesheetable' resource, including all legacy mode features but
         * without any extensions.
         *
         * See also {@link TimesheetableResource} for just the fields
         */
        export interface Timesheetable extends WithLegacy<TimesheetableResource> {}
      `,
      [F.extension('timesheetable')]: ts`
        import type { Timesheetable } from './timesheetable.type.ts';

        // @ts-ignore-error in reality fields are not merged, they are overridden
        export interface TimesheetableExtension extends Timesheetable {}
        export class TimesheetableExtension {
          formatMeta() {
            return JSON.stringify(this.meta);
          }
        }

        const Registration = {
          kind: 'object',
          name: 'timesheetable',
          features: TimesheetableExtension,
        };
        export default Registration;
      `,
    },
  });

  test('[TS] Interface with typeof imported value preserves value import in type file', {
    input: {
      [F.tsmodel('timesheetable')]: ts`
        import Model, { attr } from '@ember-data/model';
        import { TimesheetableType } from '@test-app/consts/timesheet';
        import type { RegionMeta } from './region-meta';

        export interface TimesheetableMetaRegion {
          type: typeof TimesheetableType.REGION;
          region: RegionMeta;
        }

        export default class Timesheetable extends Model {
          @attr() declare meta: TimesheetableMetaRegion;
          @attr declare name: string;

          formatMeta() {
            return JSON.stringify(this.meta);
          }
        }
      `,
    },
    output: {
      [F.resource('timesheetable')]: ts`
        import { withDefaults } from '@ember-data/model/migration-support';

        const TimesheetableSchema = withDefaults({
          type: 'timesheetable',
          fields: [
            {
              kind: 'attribute',
              name: 'meta'
            },
            {
              kind: 'attribute',
              name: 'name'
            }
          ]
        });

        export default TimesheetableSchema;
      `,
      [F.resourceType('timesheetable')]: ts`
        import type { Type } from '@warp-drive/core-types/symbols';
        import type { WithLegacy } from '@ember-data/model/migration-support';
        import { TimesheetableType } from '@test-app/consts/timesheet';
        import type { RegionMeta } from './region-meta';

        export interface TimesheetableMetaRegion {
          type: typeof TimesheetableType.REGION;
          region: RegionMeta;
        }

        /**
         * This type represents the full set schema derived fields of
         * the 'timesheetable' resource, without any of the legacy mode features
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
         * See also {@link Timesheetable} for fields + legacy mode features
         */
        export interface TimesheetableResource {
          readonly [Type]: 'timesheetable';
          id: string | null;
          meta: TimesheetableMetaRegion;
          name: string;
        }

        /**
         * This type represents the full set schema derived fields of
         * the 'timesheetable' resource, including all legacy mode features but
         * without any extensions.
         *
         * See also {@link TimesheetableResource} for just the fields
         */
        export interface Timesheetable extends WithLegacy<TimesheetableResource> {}
      `,
      [F.extension('timesheetable')]: ts`
        import { TimesheetableType } from '@test-app/consts/timesheet';
        import type { Timesheetable } from './timesheetable.type.ts';

        // @ts-ignore-error in reality fields are not merged, they are overridden
        export interface TimesheetableExtension extends Timesheetable {}
        export class TimesheetableExtension {
          formatMeta() {
            return JSON.stringify(this.meta);
          }
        }

        const Registration = {
          kind: 'object',
          name: 'timesheetable',
          features: TimesheetableExtension,
        };
        export default Registration;
      `,
    },
  });
});
