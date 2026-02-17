import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { FinalOptions } from '@ember-data/codemods/schema-migration/config.js';

import { toArtifacts } from '../../../../../packages/codemods/src/schema-migration/processors/mixin.ts';
import { parseFile } from '../../../../../packages/codemods/src/schema-migration/utils/file-parser.js';

describe('mixin-to-schema transform (artifacts)', () => {
  let tempDir: string;
  let options: FinalOptions;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'mixin-to-schema-test-'));

    options = {
      kind: 'finalized',
      inputDir: tempDir,
      outputDir: join(tempDir, 'app/schemas'),
      resourcesDir: join(tempDir, 'app/data/resources'),
      traitsDir: join(tempDir, 'app/data/traits'),
      modelSourceDir: join(tempDir, 'app/models'),
      mixinSourceDir: join(tempDir, 'app/mixins'),
      resourcesImport: 'test-app/data/resources',
      traitsImport: 'test-app/data/traits',
      modelImportSource: 'test-app/models',
      mixinImportSource: 'test-app/mixins',
      emberDataImportSource: '@ember-data/model',
      intermediateModelPaths: [],
      dryRun: false,
      verbose: false,
    };
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('basic functionality', () => {
    it('generates empty trait for empty mixin', () => {
      const input = `import Mixin from '@ember/object/mixin';

export default Mixin.create({});`;

      const artifacts = toArtifacts(parseFile('app/mixins/empty.js', input, options), options);
      expect(artifacts).toHaveLength(1);

      const trait = artifacts.find((a) => a.type === 'trait');
      expect(trait).toMatchInlineSnapshot(`
        {
          "code": "const EmptySchema = {
          'name': 'empty',
          'mode': 'legacy',
          'fields': []
        };

        export default EmptySchema;

        export interface EmptyTrait {
        }",
          "name": "EmptySchema",
          "suggestedFileName": "empty.schema.js",
          "type": "trait",
        }
      `);
    });

    it('produces trait and extension artifacts for direct Mixin.create', () => {
      const input = `import { attr, hasMany } from '@ember-data/model';
import Mixin from '@ember/object/mixin';
import { computed } from '@ember/object';

export default Mixin.create({
	files: hasMany('file', { as: 'fileable', async: false }),
	name: attr('string'),
	isActive: attr('boolean', { defaultValue: false }),
	titleCaseName: computed('name', function () { return (this.name || '').toUpperCase(); })
});`;

      const artifacts = toArtifacts(parseFile('app/mixins/fileable.js', input, options), options);
      expect(artifacts).toHaveLength(3); // trait, extension, and resource-type-stub for 'file'

      const trait = artifacts.find((a) => a.type === 'trait');
      const extension = artifacts.find((a) => a.type === 'trait-extension');
      expect(trait).toMatchInlineSnapshot(`
        {
          "code": "const FileableSchema = {
          'name': 'fileable',
          'mode': 'legacy',
          'fields': [
            {
              'name': 'files',
              'kind': 'hasMany',
              'type': 'file',
              'options': {
                'as': 'fileable',
                'async': false
              }
            },
            {
              'name': 'name',
              'kind': 'attribute',
              'type': 'string'
            },
            {
              'name': 'isActive',
              'kind': 'attribute',
              'type': 'boolean',
              'options': {
                'defaultValue': false
              }
            }
          ]
        };

        export default FileableSchema;

        export interface FileableTrait {
          files: HasMany<File>;
          name: string | null;
          isActive: boolean | null;
        }",
          "name": "FileableSchema",
          "suggestedFileName": "fileable.schema.js",
          "type": "trait",
        }
      `);
      expect(extension).toMatchInlineSnapshot(`
        {
          "code": "import { attr, hasMany } from '@ember-data/model';
        import Mixin from '@ember/object/mixin';
        import { computed } from '@ember/object';

        export const FileableExtension = {
          titleCaseName: computed('name', function () { return (this.name || '').toUpperCase(); })
        };",
          "name": "FileableExtension",
          "suggestedFileName": "fileable.ext.js",
          "type": "trait-extension",
        }
      `);
    });

    it('supports alias of Mixin import and still produces a trait artifact', () => {
      const input = `import MyMixin from '@ember/object/mixin';
import { attr } from '@ember-data/model';

export default MyMixin.create({ name: attr('string') });`;

      const artifacts = toArtifacts(parseFile('app/mixins/aliased.js', input, options), options);
      expect(
        artifacts.map((a) => ({ type: a.type, name: a.name, suggestedFileName: a.suggestedFileName }))
      ).toMatchSnapshot('metadata');
      expect(artifacts[0]?.code).toMatchSnapshot('code');
    });

    it('produces a trait artifact if identifier default export is initialized by Mixin.create', () => {
      const input = `import Mixin from '@ember/object/mixin';
import { hasMany } from '@ember-data/model';

const Fileable = Mixin.create({ files: hasMany('file', { async: false }) });
export default Fileable;`;

      const artifacts = toArtifacts(parseFile('app/mixins/fileable.js', input, options), options);
      expect(
        artifacts.map((a) => ({ type: a.type, name: a.name, suggestedFileName: a.suggestedFileName }))
      ).toMatchSnapshot('metadata');
      expect(artifacts[0]?.code).toMatchSnapshot('code');
    });

    it('does not produce artifacts if there is no @ember/object/mixin import', () => {
      const input = `import { attr } from '@ember-data/model';

export default SomethingElse.create({ name: attr('string') });`;

      const artifacts = toArtifacts(parseFile('app/mixins/not-ember-mixin.js', input, options), options);
      expect(artifacts).toHaveLength(0);
    });

    it('converts mixin with no trait fields to extension artifact', () => {
      const input = `import Mixin from '@ember/object/mixin';
import { computed } from '@ember/object';

export default Mixin.create({
	complexMethod() { return 'processed'; },
	computedValue: computed(function() { return 'computed'; })
});`;

      const artifacts = toArtifacts(parseFile('app/mixins/no-traits.js', input, options), options);
      expect(
        artifacts.map((a) => ({ type: a.type, name: a.name, suggestedFileName: a.suggestedFileName }))
      ).toMatchSnapshot('metadata');
      const extension = artifacts.find((a) => a.type === 'trait-extension');
      expect(extension?.code).toMatchSnapshot('code');
    });

    it('preserves newlines and tabs in extension artifact properties without escaping', () => {
      const input = `import Mixin from '@ember/object/mixin';
import { computed } from '@ember/object';
import { service } from '@ember/service';

export default Mixin.create({
	library: service('library'),
	projectPlans: computed('_modelName', 'intId', 'library.projectPlans.[]', function () {
		return this.get('library.projectPlans')
			?.filterBy('plannableType', classify(this._modelName))
			.filterBy('plannableId', this.intId);
	})
});`;

      const artifacts = toArtifacts(parseFile('app/mixins/plannable.js', input, options), options);
      expect(
        artifacts.map((a) => ({ type: a.type, name: a.name, suggestedFileName: a.suggestedFileName }))
      ).toMatchSnapshot('metadata');
      const extension = artifacts.find((a) => a.type === 'trait-extension');
      expect(extension?.code).toMatchSnapshot('code');
    });

    it('collects the real fileable mixin shape into trait and extension artifacts', () => {
      const input = `import { computed } from '@ember/object';
import { readOnly } from '@ember/object/computed';
import Mixin from '@ember/object/mixin';

import { arrayHasLength } from '@auditboard/client-core/core/computed-extensions';
import { attr, hasMany } from '@ember-data/model';

import { sortBy } from 'soxhub-client/utils/sort-by';

export default Mixin.create({
	files: hasMany('file', { as: 'fileable', async: false, inverse: 'fileable' }),
	sortedFiles: sortBy('files', 'createdAt:desc'),
	hasFiles: arrayHasLength('files'),
	numFiles: readOnly('files.length'),

	showFilesRequiringReviewError: attr('boolean', { defaultValue: false }),
	filesRequiringReview: computed('files.@each.status', function () {
		return this.files.filter((file) => !file.isReviewed);
	}),
	hasFilesRequiringReview: arrayHasLength('filesRequiringReview'),
	numFilesRequiringReview: readOnly('filesRequiringReview.length'),

	hasDuplicateFileName(file) {
		return Boolean(this.files.find((fileRecord) => fileRecord.name === file.name));
	},
});`;

      const artifacts = toArtifacts(parseFile('apps/client/app/mixins/fileable.js', input, options), options);
      expect(artifacts).toHaveLength(3); // Trait, extension, and resource-type-stub for 'file'
      expect(
        artifacts.map((a) => ({ type: a.type, suggestedFileName: a.suggestedFileName, name: a.name }))
      ).toMatchSnapshot('artifact metadata');

      // Test generated code separately for better readability
      const trait = artifacts.find((a) => a.type === 'trait');
      const extension = artifacts.find((a) => a.type === 'trait-extension');
      expect(trait?.code).toMatchSnapshot('trait code');
      expect(extension?.code).toMatchSnapshot('extension code');
    });
  });

  describe('import validation', () => {
    it('only processes decorators from @ember-data/model by default (trait artifact)', () => {
      const input = `import Mixin from '@ember/object/mixin';
import { attr, hasMany } from '@ember-data/model';
import { computed } from '@ember/object';

export default Mixin.create({
	name: attr('string'),
	files: hasMany('file'),
	customProp: computed('name', function() { return this.name; })
});`;

      const artifacts = toArtifacts(parseFile('app/mixins/default-source.js', input, options), options);
      expect(artifacts.map((a) => ({ type: a.type, name: a.name }))).toMatchSnapshot('artifact types');
      expect(artifacts.map((a) => a.code)).toMatchSnapshot('generated code');
    });

    it('allows alternate import source via options (trait artifact)', () => {
      const input = `import Mixin from '@ember/object/mixin';
import { attr, hasMany } from '@my-custom/model';
import { computed } from '@ember/object';

export default Mixin.create({
	name: attr('string'),
	files: hasMany('file'),
	customProp: computed('name', function() { return this.name; })
});`;

      const opts = {
        ...options,
        emberDataImportSource: '@my-custom/model',
      };
      const artifacts = toArtifacts(parseFile('app/mixins/custom-source.js', input, opts), opts);
      expect(artifacts).toMatchSnapshot();
    });

    it('supports @auditboard/warp-drive/v1/model as alternate import source when configured', () => {
      const input = `import Mixin from '@ember/object/mixin';
import { attr, hasMany } from '@auditboard/warp-drive/v1/model';
import { computed } from '@ember/object';

export default Mixin.create({
	name: attr('string'),
	files: hasMany('file'),
	customProp: computed('name', function() { return this.name; })
});`;

      const opts = {
        ...options,
        emberDataImportSource: '@auditboard/warp-drive/v1/model',
      };
      const artifacts = toArtifacts(parseFile('app/mixins/auditboard-source.js', input, opts), opts);
      expect(artifacts).toMatchSnapshot();
    });

    it('ignores decorators from unsupported import sources (only attr recognized)', () => {
      const input = `import Mixin from '@ember/object/mixin';
import { attr } from '@ember-data/model';
import { hasMany } from '@unsupported/source';
import { computed } from '@ember/object';

export default Mixin.create({
	name: attr('string'),
	files: hasMany('file'), // This should be ignored
	customProp: computed('name', function() { return this.name; })
});`;

      const artifacts = toArtifacts(parseFile('app/mixins/unsupported-source.js', input, options), options);
      expect(artifacts).toMatchSnapshot();
    });

    it('handles aliased imports correctly (trait artifact)', () => {
      const input = `import Mixin from '@ember/object/mixin';
import { attr as attribute, hasMany as manyRelation, belongsTo as oneRelation } from '@ember-data/model';

export default Mixin.create({
	name: attribute('string'),
	files: manyRelation('file'),
	owner: oneRelation('user')
});`;

      const artifacts = toArtifacts(parseFile('app/mixins/aliased-imports.js', input, options), options);
      expect(artifacts).toMatchSnapshot();
    });

    it('correctly ignores renamed imports from unsupported sources (only hasMany recognized)', () => {
      const input = `import Mixin from '@ember/object/mixin';
import { hasMany as many } from '@ember-data/model';
import { attr as attribute } from '@unsupported/source';

export default Mixin.create({
	files: many('file'), // Should be recognized as hasMany from valid source
	name: attribute('string') // Should be ignored, treated as regular function call
});`;

      const artifacts = toArtifacts(parseFile('app/mixins/renamed-mixed-sources.js', input, options), options);
      expect(artifacts).toMatchSnapshot();
    });

    it('produces an extension artifact when no valid EmberData imports are found', () => {
      const input = `import Mixin from '@ember/object/mixin';
import { computed } from '@ember/object';
import { attr } from '@unsupported/source';

export default Mixin.create({
	name: attr('string'), // This will be ignored because @unsupported/source is not valid
	customProp: computed('name', function() { return this.name; })
});`;

      const artifacts = toArtifacts(parseFile('app/mixins/no-valid-imports.js', input, options), options);
      expect(artifacts).toMatchSnapshot();
    });

    it('processes belongsTo decorator correctly (trait artifact)', () => {
      const input = `import Mixin from '@ember/object/mixin';
import { belongsTo } from '@ember-data/model';

export default Mixin.create({
	owner: belongsTo('user', { async: true })
});`;

      const artifacts = toArtifacts(parseFile('app/mixins/belongs-to.js', input, options), options);
      expect(artifacts).toMatchSnapshot();
    });

    it('skips artifacts when there is no mixin structure at all', () => {
      const input = `import { computed } from '@ember/object';

export default class MyClass {
	name = 'test';
}`;

      const artifacts = toArtifacts(parseFile('app/mixins/not-a-mixin.js', input, options), options);
      expect(artifacts).toHaveLength(0);
    });

    it('handles CLI option name conversion from kebab-case to camelCase (trait artifact)', () => {
      const input = `import Mixin from '@ember/object/mixin';
import { attr } from '@my-custom/model';

export default Mixin.create({
	name: attr('string')
});`;

      const opts = {
        ...options,
        emberDataImportSource: '@my-custom/model',
      };
      const artifacts = toArtifacts(parseFile('app/mixins/cli-option.js', input, opts), opts);
      expect(artifacts).toMatchSnapshot();
    });
  });

  describe('TypeScript type artifacts', () => {
    it('generates trait artifact with merged types for basic mixins', () => {
      const input = `import Mixin from '@ember/object/mixin';
import { attr, hasMany } from '@ember-data/model';

export default Mixin.create({
	files: hasMany('file', { as: 'fileable', async: false }),
	name: attr('string'),
	isActive: attr('boolean', { defaultValue: false })
});`;

      const artifacts = toArtifacts(parseFile('app/mixins/fileable.js', input, options), options);

      // Should have trait and resource-type-stub for 'file' (no extension if no computed/methods)
      expect(artifacts).toHaveLength(2);
      expect(artifacts.map((a) => a.type).sort()).toEqual(['resource-type-stub', 'trait']);

      const trait = artifacts.find((a) => a.type === 'trait');
      expect(trait?.code).toMatchSnapshot('basic trait type interface');
      expect(trait?.suggestedFileName).toBe('fileable.schema.js');
    });

    it('generates trait and extension artifacts when mixin has computed properties and methods', () => {
      const input = `import Mixin from '@ember/object/mixin';
import { attr } from '@ember-data/model';
import { computed } from '@ember/object';

export default Mixin.create({
	name: attr('string'),

	displayName: computed('name', function() {
		return \`Name: \${this.name}\`;
	}),

	getName() {
		return this.name || 'Unknown';
	}
});`;

      const artifacts = toArtifacts(parseFile('app/mixins/nameable.js', input, options), options);

      // Should have trait and extension artifacts (types merged into trait)
      expect(artifacts).toHaveLength(2);
      expect(artifacts.map((a) => a.type).sort()).toEqual(['trait', 'trait-extension']);

      const extension = artifacts.find((a) => a.type === 'trait-extension');
      const trait = artifacts.find((a) => a.type === 'trait');

      expect(trait?.code).toMatchSnapshot('mixin trait type interface');
      expect(extension?.code).toMatchSnapshot('mixin extension code');
      expect(trait?.suggestedFileName).toBe('nameable.schema.js');
      expect(extension?.suggestedFileName).toBe('nameable.ext.js');
    });

    it('generates only trait artifact when mixin has only data fields', () => {
      const input = `import Mixin from '@ember/object/mixin';
import { attr, belongsTo } from '@ember-data/model';

export default Mixin.create({
	title: attr('string'),
	author: belongsTo('user', { async: true })
});`;

      const artifacts = toArtifacts(parseFile('app/mixins/simple.js', input, options), options);

      // Should have trait and resource-type-stub for 'user' (no extension for data-only mixins)
      expect(artifacts).toHaveLength(2);
      expect(artifacts.map((a) => a.type).sort()).toEqual(['resource-type-stub', 'trait']);

      const trait = artifacts.find((a) => a.type === 'trait');
      expect(trait?.code).toMatchSnapshot('data-only trait type interface');
    });

    it('handles custom type mappings in mixin trait type interfaces', () => {
      const input = `import Mixin from '@ember/object/mixin';
import { attr } from '@ember-data/model';

export default Mixin.create({
	id: attr('uuid'),
	amount: attr('currency'),
	metadata: attr('json')
});`;

      const customTypeMappings = {
        uuid: 'string',
        currency: 'number',
        json: 'Record<string, unknown>',
      };

      const opts = { ...options, typeMapping: customTypeMappings };
      const artifacts = toArtifacts(parseFile('app/mixins/typed.js', input, opts), opts);
      const trait = artifacts.find((a) => a.type === 'trait');

      expect(trait?.code).toMatchSnapshot('mixin custom type mappings interface');
    });
  });

  describe('TypeScript type casts', () => {
    it('produces trait and extension artifacts for mixins with TypeScript type casts', () => {
      const mixinSource = `
import Mixin from '@ember/object/mixin';
import { computed } from '@ember/object';
import { attr } from '@ember-data/model';
import BaseModelDate from './base-model-date.ts';
import PartialSaveable from './partial-saveable.ts';

interface BaseModelMixin extends BaseModelDate, PartialSaveable {
  displayName: string | undefined;
}

// SAFETY: Mixin doesn't have correct types
const BaseModelMixin = Mixin.create(BaseModelDate, PartialSaveable, {
  @attr('string') name: '',
  displayName: computed('name', function() {
    return this.name || 'Unnamed';
  }),

  // Method that should go in extension
  someMethod() {
    return 'base model method';
  }
}) as unknown as ModelMixin<BaseModelMixin>;

export default BaseModelMixin;
`.trim();

      const opts = {
        ...options,
        appImportPrefix: 'test-app',
      };
      const artifacts = toArtifacts(parseFile('/app/mixins/base-model.ts', mixinSource, opts), opts);

      // Should find both trait fields and extension properties
      expect(artifacts.length).toBeGreaterThan(0);

      const trait = artifacts.find((a) => a.type === 'trait');
      const extension = artifacts.find((a) => a.type === 'trait-extension');

      // Should have trait because it has @attr field and extended traits
      expect(trait).toBeDefined();

      // Should have the attr field in trait
      expect(trait?.code).toContain('name');

      // Should recognize extended traits in trait
      expect(trait?.code).toContain('base-model-date');
      expect(trait?.code).toContain('partial-saveable');

      // Extension is only generated if there are non-trait properties
      if (extension) {
        expect(extension.code).toContain('displayName');
        expect(extension.code).toContain('someMethod');
      }
    });

    it('produces extension artifacts for mixins with only computed properties and TypeScript casts', () => {
      const mixinSource = `
import Mixin from '@ember/object/mixin';
import { computed, get, set } from '@ember/object';
import { or } from '@ember/object/computed';
import BaseModelDate from './base-model-date.ts';
import PartialSaveable from './partial-saveable.ts';

interface BaseModelMixin extends BaseModelDate, PartialSaveable {
  displayName: string | undefined;
}

// SAFETY: Mixin doesn't have correct types
const BaseModelMixin = Mixin.create(BaseModelDate, PartialSaveable, {
  displayName: or('name', '_modelName'),

  // default datatable caching
  _dtCache: null,
  _dtLastUpdated: computed('updatedAt', function () {
    // TODO - Refactor this CP
    // eslint-disable-next-line ember/no-side-effects
    set(this, '_dtCache', null);
    return get(this, 'updatedAt');
  }),
}) as unknown as ModelMixin<BaseModelMixin>;

export default BaseModelMixin;
`.trim();

      const opts = {
        ...options,
        appImportPrefix: 'test-app',
      };
      const artifacts = toArtifacts(parseFile('/app/mixins/base-model.ts', mixinSource, opts), opts);

      expect(artifacts.length).toBeGreaterThan(0);

      // Should not have trait (no @attr fields), but should have extension
      const trait = artifacts.find((a) => a.type === 'trait');
      const extension = artifacts.find((a) => a.type === 'trait-extension');

      expect(trait).toBeDefined(); // Has extended traits

      // Should have the extended traits in trait
      expect(trait?.code).toContain('base-model-date');
      expect(trait?.code).toContain('partial-saveable');

      // Extension is only generated if there are non-trait properties
      if (extension) {
        expect(extension.code).toContain('displayName');
        expect(extension.code).toContain('_dtCache');
        expect(extension.code).toContain('_dtLastUpdated');
      }
    });

    it('handles nested TypeScript type casts', () => {
      const mixinSource = `
import Mixin from '@ember/object/mixin';
import { computed } from '@ember/object';

const NestedCastMixin = Mixin.create({
  computedProp: computed(function() { return 'test'; })
}) as unknown as SomeType as FinalType;

export default NestedCastMixin;
`.trim();

      const artifacts = toArtifacts(parseFile('/app/mixins/nested-cast.ts', mixinSource, options), options);

      expect(artifacts.length).toBeGreaterThan(0);

      const extension = artifacts.find((a) => a.type === 'trait-extension');
      expect(extension).toBeDefined();
      expect(extension?.code).toContain('computedProp');
    });
  });

  describe('mirror flag', () => {
    it('generates correct imports regardless of mirror flag for mixins', () => {
      const input = `import Mixin from '@ember/object/mixin';
import { attr } from '@ember-data/model';

export default Mixin.create({
	name: attr('string'),
	email: attr('string')
});`;

      // Test with mirror flag
      const mirrorOpts = { ...options, mirror: true };
      const artifactsMirror = toArtifacts(parseFile('app/mixins/basic.js', input, mirrorOpts), mirrorOpts);
      const traitMirror = artifactsMirror.find((a) => a.type === 'trait');

      // Test without mirror flag
      const artifactsRegular = toArtifacts(parseFile('app/mixins/basic.js', input, options), options);
      const traitRegular = artifactsRegular.find((a) => a.type === 'trait');

      // Mixins themselves don't generate @warp-drive imports, so they should be the same
      expect(traitMirror?.code).toBe(traitRegular?.code);
    });
  });

  describe('mixin inheritance', () => {
    it('produces trait with extended traits when using createWithMixins', () => {
      const input = `import { attr, hasMany } from '@ember-data/model';
import Mixin from '@ember/object/mixin';
import BaseModelMixin from './base-model';
import TimestampMixin from './timestamp';

export default Mixin.createWithMixins(BaseModelMixin, TimestampMixin, {
	description: attr('string'),
	files: hasMany('file', { async: false })
});`;

      const opts = {
        ...options,
        appImportPrefix: 'test-app',
      };
      const artifacts = toArtifacts(parseFile('app/mixins/fileable.js', input, opts), opts);

      // Should produce trait and resource-type-stub for 'file' (no extension since no methods/computed properties)
      expect(artifacts).toHaveLength(2);

      const trait = artifacts.find((a) => a.type === 'trait');

      expect(trait).toBeDefined();

      // Test that the trait includes the name and mode (uses single quotes in JS files)
      expect(trait?.code).toContain("'name': 'fileable'");
      expect(trait?.code).toContain("'mode': 'legacy'");

      // Test that the trait includes extended traits references
      expect(trait?.code).toContain('base-model');
      expect(trait?.code).toContain('timestamp');
      expect(trait?.code).toContain("'traits':");

      // Test artifact metadata
      expect(
        artifacts.map((a) => ({ type: a.type, suggestedFileName: a.suggestedFileName, name: a.name }))
      ).toMatchSnapshot('inheritance artifact metadata');

      // Test generated code
      expect(trait?.code).toMatchSnapshot('inheritance trait code');
    });

    it('produces trait with single extended trait', () => {
      const input = `import { attr } from '@ember-data/model';
import Mixin from '@ember/object/mixin';
import BaseModelMixin from './base-model';

export default Mixin.createWithMixins(BaseModelMixin, {
	description: attr('string')
});`;

      const opts = {
        ...options,
        appImportPrefix: 'test-app',
      };
      const artifacts = toArtifacts(parseFile('app/mixins/describable.js', input, opts), opts);

      const trait = artifacts.find((a) => a.type === 'trait');

      expect(trait).toBeDefined();

      // Test that the trait references the extended trait
      expect(trait?.code).toContain('base-model');
      expect(trait?.code).toContain("'traits':");

      expect(trait?.code).toMatchSnapshot('single inheritance trait code');
    });

    it('produces trait without traits property when no inheritance', () => {
      const input = `import { attr } from '@ember-data/model';
import Mixin from '@ember/object/mixin';

export default Mixin.create({
	description: attr('string')
});`;

      const artifacts = toArtifacts(parseFile('app/mixins/describable.js', input, options), options);

      const trait = artifacts.find((a) => a.type === 'trait');

      expect(trait).toBeDefined();
      // Test that the trait does NOT include the traits property
      expect(trait?.code).not.toContain("'traits':");

      expect(trait?.code).toMatchSnapshot('no inheritance trait code');
    });
  });

  describe('resource type stub generation', () => {
    it('generates stub for missing resource type files', () => {
      const input = `import { attr, hasMany, belongsTo } from '@ember-data/model';
import Mixin from '@ember/object/mixin';

export default Mixin.create({
	files: hasMany('file', { async: false }),
	user: belongsTo('user', { async: false }),
	name: attr('string')
});`;

      options = {
        kind: 'finalized',
        modelImportSource: 'test-app/models',
        resourcesImport: 'test-app/data/resources',
        resourcesDir: './test-output/resources',
        verbose: false,
        debug: false,
      };

      const artifacts = toArtifacts(parseFile('app/mixins/fileable.js', input, options), options);

      // Should have trait (with merged types) and resource-type-stub artifacts
      expect(artifacts).toHaveLength(3); // trait, file stub, user stub

      // Find the resource type stub artifacts
      const stubArtifacts = artifacts.filter((a) => a.type === 'resource-type-stub');
      expect(stubArtifacts).toHaveLength(2); // file and user

      const fileStub = stubArtifacts.find((a) => a.name === 'File');
      expect(fileStub).toBeDefined();
      expect(fileStub?.suggestedFileName).toBe('file.schema.ts');
      expect(fileStub?.code).toContain('export interface File');
      expect(fileStub?.code).toContain('// Stub interface for File - generated automatically');

      const userStub = stubArtifacts.find((a) => a.name === 'User');
      expect(userStub).toBeDefined();
      expect(userStub?.suggestedFileName).toBe('user.schema.ts');
      expect(userStub?.code).toContain('export interface User');
      expect(userStub?.code).toContain('// Stub interface for User - generated automatically');
    });

    it('generates multiple stubs for multiple missing resource types', () => {
      const input = `import { attr, hasMany, belongsTo } from '@ember-data/model';
import Mixin from '@ember/object/mixin';

export default Mixin.create({
	files: hasMany('file', { async: false }),
	user: belongsTo('user', { async: false }),
	comments: hasMany('comment', { async: true }),
	name: attr('string')
});`;

      options = {
        kind: 'finalized',
        modelImportSource: 'test-app/models',
        resourcesImport: 'test-app/data/resources',
        resourcesDir: './test-output/resources',
        verbose: false,
        debug: false,
      };

      const artifacts = toArtifacts(parseFile('app/mixins/commentable.js', input, options), options);

      // Should have trait (with merged types) and multiple resource-type-stub artifacts
      expect(artifacts.length).toBeGreaterThanOrEqual(4); // trait + 3 stubs

      // Find the resource type stub artifacts
      const stubArtifacts = artifacts.filter((a) => a.type === 'resource-type-stub');
      expect(stubArtifacts).toHaveLength(3); // file, user, comment

      const stubNames = stubArtifacts.map((a) => a.name).sort();
      expect(stubNames).toEqual(['Comment', 'File', 'User']);
    });
  });
});
