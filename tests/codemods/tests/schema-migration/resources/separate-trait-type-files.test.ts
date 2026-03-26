import { describe } from 'vitest';

import { F, js, test, ts } from '../-utils/test.ts';

describe('combineSchemasAndTypes: false (default) - trait type files', function () {
  test('[JS] mixin with fields produces separate .schema.ts and .type.ts trait files', {
    input: {
      [F.jsmodel('user')]: js`
        import Model, { attr } from '@ember-data/model';
        import Timestamped from '../mixins/timestamped';

        export default class User extends Model.extend(Timestamped) {
          @attr('string') name;
        }
      `,
      [F.jsmixin('timestamped')]: js`
        import Mixin from '@ember/object/mixin';
        import { attr } from '@ember-data/model';

        export default Mixin.create({
          createdAt: attr('date'),
          updatedAt: attr('date'),
        });
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
              name: 'name',
              type: 'string',
            },
          ],
          traits: ['timestamped'],
        });

        export default UserSchema;
      `,
      [F.resourceType('user')]: ts`
        import type { Type } from '@warp-drive/core-types/symbols';
        import type { WithLegacy } from '@ember-data/model/migration-support';
        import type { TimestampedTrait } from '../traits/timestamped.type';

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
        export interface UserResource extends TimestampedTrait {
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
      [F.resource('timestamped')]: ts`
        import type { LegacyTrait } from '@warp-drive/core-types/schema/fields';

        const TimestampedTraitSchema = {
          name: 'timestamped',
          mode: 'legacy',
          fields: [
            {
              name: 'createdAt',
              kind: 'attribute',
              type: 'date',
            },
            {
              name: 'updatedAt',
              kind: 'attribute',
              type: 'date',
            },
          ],
        } satisfies LegacyTrait;

        export default TimestampedTraitSchema;
      `,
      [F.resourceType('timestamped')]: ts`
        /**
         * This type represents the full set schema derived fields of
         * the 'timestamped' trait, without any of the legacy mode features
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
        export interface TimestampedTrait {
          createdAt?: Date | null;
          updatedAt?: Date | null;
        }
      `,
    },
  });

  test('[TS] mixin with fields produces separate .schema.ts and .type.ts trait files', {
    input: {
      [F.tsmodel('user')]: ts`
        import Model, { attr } from '@ember-data/model';
        import Timestamped from '../mixins/timestamped';

        export default class User extends Model.extend(Timestamped) {
          @attr('string') name: string;
        }
      `,
      [F.tsmixin('timestamped')]: ts`
        import Mixin from '@ember/object/mixin';
        import { attr } from '@ember-data/model';

        export default Mixin.create({
          createdAt: attr('date'),
          updatedAt: attr('date'),
        });
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
              name: 'name',
              type: 'string',
            },
          ],
          traits: ['timestamped'],
        });

        export default UserSchema;
      `,
      [F.resourceType('user')]: ts`
        import type { Type } from '@warp-drive/core-types/symbols';
        import type { WithLegacy } from '@ember-data/model/migration-support';
        import type { TimestampedTrait } from '../traits/timestamped.type';

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
        export interface UserResource extends TimestampedTrait {
          readonly [Type]: 'user';
          id: string | null;
          name: string;
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
      [F.resource('timestamped')]: ts`
        import type { LegacyTrait } from '@warp-drive/core-types/schema/fields';

        const TimestampedTraitSchema = {
          name: 'timestamped',
          mode: 'legacy',
          fields: [
            {
              name: 'createdAt',
              kind: 'attribute',
              type: 'date',
            },
            {
              name: 'updatedAt',
              kind: 'attribute',
              type: 'date',
            },
          ],
        } satisfies LegacyTrait;

        export default TimestampedTraitSchema;
      `,
      [F.resourceType('timestamped')]: ts`
        /**
         * This type represents the full set schema derived fields of
         * the 'timestamped' trait, without any of the legacy mode features
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
        export interface TimestampedTrait {
          createdAt?: Date | null;
          updatedAt?: Date | null;
        }
      `,
    },
  });

  test('[JS] mixin with fields and extension produces separate .schema.ts, .type.ts, and .ext files', {
    input: {
      [F.jsmodel('project')]: js`
        import Model, { attr } from '@ember-data/model';
        import Teamable from '../mixins/teamable';

        export default class Project extends Model.extend(Teamable) {
          @attr('string') name;
        }
      `,
      [F.jsmixin('teamable')]: js`
        import { filterBy } from '@ember/object/computed';
        import Mixin from '@ember/object/mixin';
        import { hasMany } from '@ember-data/model';

        export default Mixin.create({
          allowedTeams: hasMany('allowed-team', {
            async: false,
            inverse: 'teamable',
            as: 'teamable',
          }),
          adminTeams: filterBy('allowedTeams', 'permission', 'admin'),
        });
      `,
    },
    output: {
      [F.resource('project')]: ts`
        import { withDefaults } from '@ember-data/model/migration-support';

        const ProjectSchema = withDefaults({
          type: 'project',
          fields: [
            {
              kind: 'attribute',
              name: 'name',
              type: 'string',
            },
          ],
          traits: ['teamable'],
          objectExtensions: ['TeamableTraitExtension'],
        });

        export default ProjectSchema;
      `,
      [F.resourceType('project')]: ts`
        import type { Type } from '@warp-drive/core-types/symbols';
        import type { WithLegacy } from '@ember-data/model/migration-support';
        import type { TeamableTrait } from '../traits/teamable.type';

        /**
         * This type represents the full set schema derived fields of
         * the 'project' resource, without any of the legacy mode features
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
         * See also {@link Project} for fields + legacy mode features
         */
        export interface ProjectResource extends TeamableTrait {
          readonly [Type]: 'project';
          id: string | null;
          name: string | null;
        }

        /**
         * This type represents the full set schema derived fields of
         * the 'project' resource, including all legacy mode features but
         * without any extensions.
         *
         * See also {@link ProjectResource} for just the fields
         */
        export interface Project extends WithLegacy<ProjectResource> {}
      `,
      [F.resource('teamable')]: ts`
        import type { LegacyTrait } from '@warp-drive/core-types/schema/fields';

        const TeamableTraitSchema = {
          name: 'teamable',
          mode: 'legacy',
          fields: [
            {
              name: 'allowedTeams',
              kind: 'hasMany',
              type: 'allowed-team',
              options: {
                async: false,
                inverse: 'teamable',
                as: 'teamable',
              },
            },
          ],
        } satisfies LegacyTrait;

        export default TeamableTraitSchema;
      `,
      [F.resourceType('teamable')]: ts`
        import type { HasMany } from '@ember-data/model';
        import type { AllowedTeam } from './allowed-team.type.ts';

        /**
         * This type represents the full set schema derived fields of
         * the 'teamable' trait, without any of the legacy mode features
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
        export interface TeamableTrait {
          allowedTeams?: HasMany<AllowedTeam>;
        }
      `,
      [F.extension('teamable', 'js')]: js`
        import { filterBy } from '@ember/object/computed';

        // TODO: migrate this extension to a class so that TypeScript declaration merging works.
        // Object extensions do not support interface merging.
        export const TeamableTraitExtension = {
          adminTeams: filterBy('allowedTeams', 'permission', 'admin'),
        };

        const Registration = {
          kind: 'object',
          name: 'teamable',
          features: TeamableTraitExtension,
        };
        export default Registration;
      `,
    },
  });

  test('[JS] mixin extending another mixin uses .type imports between traits', {
    input: {
      [F.jsmodel('user')]: js`
        import Model, { attr } from '@ember-data/model';
        import Timestamped from '../mixins/timestamped';

        export default class User extends Model.extend(Timestamped) {
          @attr('string') email;
        }
      `,
      [F.jsmodel('post')]: js`
        import Model, { attr } from '@ember-data/model';
        import Publishable from '../mixins/publishable';

        export default class Post extends Model.extend(Publishable) {
          @attr('string') title;
        }
      `,
      [F.jsmixin('timestamped')]: js`
        import Mixin from '@ember/object/mixin';
        import { attr } from '@ember-data/model';

        export default Mixin.create({
          createdAt: attr('date'),
          updatedAt: attr('date'),
        });
      `,
      [F.jsmixin('publishable')]: js`
        import Mixin from '@ember/object/mixin';
        import { attr } from '@ember-data/model';
        import Timestamped from './timestamped';

        export default Mixin.create(Timestamped, {
          publishedAt: attr('date'),
        });
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
              name: 'email',
              type: 'string',
            },
          ],
          traits: ['timestamped'],
        });

        export default UserSchema;
      `,
      [F.resourceType('user')]: ts`
        import type { Type } from '@warp-drive/core-types/symbols';
        import type { WithLegacy } from '@ember-data/model/migration-support';
        import type { TimestampedTrait } from '../traits/timestamped.type';

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
        export interface UserResource extends TimestampedTrait {
          readonly [Type]: 'user';
          id: string | null;
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
      [F.resource('post')]: ts`
        import { withDefaults } from '@ember-data/model/migration-support';

        const PostSchema = withDefaults({
          type: 'post',
          fields: [
            {
              kind: 'attribute',
              name: 'title',
              type: 'string',
            },
          ],
          traits: ['publishable'],
        });

        export default PostSchema;
      `,
      [F.resourceType('post')]: ts`
        import type { Type } from '@warp-drive/core-types/symbols';
        import type { WithLegacy } from '@ember-data/model/migration-support';
        import type { PublishableTrait } from '../traits/publishable.type';

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
        export interface PostResource extends PublishableTrait {
          readonly [Type]: 'post';
          id: string | null;
          title: string | null;
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
      [F.resource('timestamped')]: ts`
        import type { LegacyTrait } from '@warp-drive/core-types/schema/fields';

        const TimestampedTraitSchema = {
          name: 'timestamped',
          mode: 'legacy',
          fields: [
            {
              name: 'createdAt',
              kind: 'attribute',
              type: 'date',
            },
            {
              name: 'updatedAt',
              kind: 'attribute',
              type: 'date',
            },
          ],
        } satisfies LegacyTrait;

        export default TimestampedTraitSchema;
      `,
      [F.resourceType('timestamped')]: ts`
        /**
         * This type represents the full set schema derived fields of
         * the 'timestamped' trait, without any of the legacy mode features
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
        export interface TimestampedTrait {
          createdAt?: Date | null;
          updatedAt?: Date | null;
        }
      `,
      [F.resource('publishable')]: ts`
        import type { LegacyTrait } from '@warp-drive/core-types/schema/fields';

        const PublishableTraitSchema = {
          name: 'publishable',
          mode: 'legacy',
          fields: [
            {
              name: 'publishedAt',
              kind: 'attribute',
              type: 'date',
            },
          ],
          traits: ['timestamped'],
        } satisfies LegacyTrait;

        export default PublishableTraitSchema;
      `,
      [F.resourceType('publishable')]: ts`
        import type { TimestampedTrait } from '../traits/timestamped.type';

        /**
         * This type represents the full set schema derived fields of
         * the 'publishable' trait, without any of the legacy mode features
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
        export interface PublishableTrait extends TimestampedTrait {
          publishedAt?: Date | null;
        }
      `,
    },
  });
});
