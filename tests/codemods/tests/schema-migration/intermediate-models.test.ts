/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
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
          "code": "import type { BelongsToReference, HasManyReference, Errors } from '@warp-drive/legacy/model/-private';
      const DataFieldTrait = {
        'fields': [
          {
            'kind': 'attribute',
            'name': 'fieldName',
            'type': 'string'
          }
        ]
      } as const;

      export default DataFieldTrait;

      export interface DataFieldTrait {
        id: string | null;
        readonly fieldName: string | null;
        readonly isNew: boolean;
        readonly hasDirtyAttributes: boolean;
        readonly isDeleted: boolean;
        readonly isSaving: boolean;
        readonly isValid: boolean;
        readonly isError: boolean;
        readonly isLoaded: boolean;
        readonly isEmpty: boolean;
        save: (options?: Record<string, unknown>) => Promise<this>;
        reload: (options?: Record<string, unknown>) => Promise<this>;
        deleteRecord: () => void;
        unloadRecord: () => void;
        destroyRecord: (options?: Record<string, unknown>) => Promise<void>;
        rollbackAttributes: () => void;
        belongsTo: (propertyName: string) => BelongsToReference;
        hasMany: (propertyName: string) => HasManyReference;
        serialize: (options?: Record<string, unknown>) => unknown;
        readonly errors: Errors;
        readonly adapterError: Error | null;
        readonly isReloading: boolean;
      }",
          "name": "DataFieldTrait",
          "suggestedFileName": "data-field.schema.ts",
          "type": "trait",
        },
      ]
    `);
  });
});
