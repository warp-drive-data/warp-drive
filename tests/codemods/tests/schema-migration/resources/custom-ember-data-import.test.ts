import { describe } from 'vitest';

import { F, js, test, ts } from '../-utils/test.ts';

describe('custom emberDataImportSource', function () {
  test('mixin with hasMany from custom import source is correctly processed', {
    config: {
      emberDataImportSource: '@auditboard/warp-drive/v1/model',
    },
    input: {
      [F.jsmodel('project')]: js`
        import Model, { attr } from '@auditboard/warp-drive/v1/model';
        import Teamable from '../mixins/teamable';

        export default class Project extends Model.extend(Teamable) {
          @attr('string') name;
        }
      `,
      [F.jsmixin('teamable')]: js`
        import { filterBy } from '@ember/object/computed';
        import Mixin from '@ember/object/mixin';
        import { hasMany } from '@auditboard/warp-drive/v1/model';

        export default Mixin.create({
          allowedTeams: hasMany('allowed-team', {
            async: false,
            inverse: 'teamable',
            as: 'teamable',
          }),
          adminTeams: filterBy('allowedTeams', 'permission', 'admin'),
          managerTeams: filterBy('allowedTeams', 'permission', 'manager'),
          viewonlyTeams: filterBy('allowedTeams', 'permission', 'viewonly'),
          createonlyTeams: filterBy('allowedTeams', 'permission', 'createonly'),
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
        import type { HasMany } from '@auditboard/warp-drive/v1/model';
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
          managerTeams: filterBy('allowedTeams', 'permission', 'manager'),
          viewonlyTeams: filterBy('allowedTeams', 'permission', 'viewonly'),
          createonlyTeams: filterBy('allowedTeams', 'permission', 'createonly'),
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
});
