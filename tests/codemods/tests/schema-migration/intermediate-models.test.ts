import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { processIntermediateModelsToTraits } from '../../../../packages/codemods/src/schema-migration/processors/model.js';
import { prepareFiles } from './test-helpers.ts';

describe('intermediate model processing', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'intermediate-models-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should process intermediate models with proper path resolution using additionalModelSources', () => {
    prepareFiles(tempDir, {
      'app/core/base-model.js': `
import Model from '@ember-data/model';
import { attr } from '@ember-data/model';

export default class BaseModel extends Model {
  @attr('string') name;
  @attr('boolean') isActive;
}
`,
    });

    const result = processIntermediateModelsToTraits(
      ['test-app/core/base-model'],
      [
        {
          pattern: 'test-app/core/*',
          dir: join(tempDir, 'app/core/*'),
        },
      ], // additional model sources with mapping
      undefined, // no additional mixin sources
      {
        verbose: false,
        debug: false,
      }
    );

    expect(result.errors.length).toBe(0);
    expect(result.artifacts.length).toBeGreaterThan(0);
  });

  it('should use additionalModelSources for path resolution', () => {
    prepareFiles(tempDir, {
      'libraries/core/src/special-model.ts': `
import Model from '@ember-data/model';
import { attr } from '@ember-data/model';

export default class SpecialModel extends Model {
  @attr('string') specialName;
  @attr('number') priority;
}
`,
    });

    const result = processIntermediateModelsToTraits(
      ['@mylib/core/special-model'],
      [
        {
          pattern: '@mylib/core/special-model',
          dir: join(tempDir, 'libraries/core/src/special-model'),
        },
      ],
      undefined,
      {
        verbose: false,
        debug: false,
      }
    );

    expect(result.errors.length).toBe(0);
    expect(result.artifacts.length).toBeGreaterThan(0);
  });

  it('should report errors for missing intermediate models', () => {
    const result = processIntermediateModelsToTraits(['non-existent/model'], undefined, undefined, {
      verbose: false,
      debug: false,
    });

    expect(result.errors.length).toBe(1);
    expect(result.errors[0]).toContain('Could not find or read intermediate model file for path: non-existent/model');
    expect(result.artifacts.length).toBe(0);
  });

  it('should include Model base properties in generated trait types', () => {
    prepareFiles(tempDir, {
      'app/core/data-field-model.ts': `
import Model from '@ember-data/model';
import { attr } from '@ember-data/model';

export default class DataFieldModel extends Model {
  @attr('string') fieldName;
}
`,
    });

    const result = processIntermediateModelsToTraits(
      ['test-app/core/data-field-model'],
      [
        {
          pattern: 'test-app/core/*',
          dir: join(tempDir, 'app/core/*'),
        },
      ],
      undefined,
      {
        verbose: false,
        debug: false,
      }
    );

    expect(result.errors.length).toBe(0);
    expect(result.artifacts).toMatchInlineSnapshot(`
      [
        {
          "baseName": "data-field",
          "code": "import type { LegacyResourceSchema } from '@warp-drive/core/types/schema/fields';

      import type { BelongsToReference, HasManyReference, Errors } from '@warp-drive/legacy/model/-private';

      const DataFieldTraitSchema = {
        'fields': [
          {
            'kind': 'attribute',
            'name': 'fieldName',
            'type': 'string'
          }
        ]
      } satisfies LegacyResourceSchema;

      export default DataFieldTraitSchema;

      /**
       * This type represents the full set schema derived fields of
       * the 'data-field' trait, without any of the legacy mode features
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
       * See also {@link DataField} for fields + legacy mode features
       */
      export interface DataFieldTrait {
        id: string | null;
        fieldName: string | null;
      }

      /**
       * This type represents the full set schema derived fields of
       * the 'data-field' trait, including all legacy mode features but
       * without any extensions.
       *
       * See also {@link DataFieldTrait} for fields + legacy mode features
       */
      export interface DataField extends WithLegacy<DataFieldTrait> {}
      ",
          "name": "DataFieldTraitSchema",
          "suggestedFileName": "data-field.schema.ts",
          "type": "trait",
        },
      ]
    `);
  });
});
