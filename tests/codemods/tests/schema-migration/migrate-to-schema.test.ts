import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { MigrateOptions } from '@ember-data/codemods/schema-migration/config.js';

import { runMigration } from '../../../../packages/codemods/src/schema-migration/tasks/migrate.js';
import { collectFilesSnapshot, collectFileStructure, prepareFiles } from './test-helpers.ts';

describe('migrate-to-schema batch operation', () => {
  let tempDir: string;
  let options: MigrateOptions;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'migrate-to-schema-test-'));

    options = {
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

  it('generates schema and type artifacts for models', async () => {
    prepareFiles(tempDir, {
      'app/models/user.ts': `
import Model, { attr, belongsTo } from '@ember-data/model';

export default class User extends Model {
  @attr('string') name;
  @attr('string') email;
  @belongsTo('company', { async: false }) company;

  // Extension property
  get displayName() {
    return this.name || this.email;
  }
}
`,
    });

    await runMigration(options);

    const dataDir = join(tempDir, 'app/data');
    expect(collectFileStructure(dataDir)).toMatchSnapshot('generated file structure');
    expect(collectFilesSnapshot(dataDir)).toMatchSnapshot('generated files');
  });

  it('skips mixin processing when no model-connected mixins are found', async () => {
    prepareFiles(tempDir, {
      'app/mixins/unused.ts': `
import Mixin from '@ember/object/mixin';

export default Mixin.create({
  commonMethod() {
    return 'common behavior';
  }
});
`,
    });

    await runMigration(options);

    const traitsDir = join(tempDir, 'app/data/traits');
    expect(collectFileStructure(traitsDir)).toMatchSnapshot('traits directory structure');
  });

  it('generates multiple artifacts when processing multiple files', async () => {
    prepareFiles(tempDir, {
      'app/models/user.ts': `
import Model, { attr } from '@ember-data/model';

export default class User extends Model {
  @attr('string') name;
  @attr('string') email;
}
`,
      'app/models/company.ts': `
import Model, { attr, hasMany } from '@ember-data/model';

export default class Company extends Model {
  @attr('string') name;
  @hasMany('user', { async: false, inverse: 'company' }) users;

  get userCount() {
    return this.users.length;
  }
}
`,
    });

    await runMigration(options);

    const dataDir = join(tempDir, 'app/data');
    expect(collectFileStructure(dataDir)).toMatchSnapshot('generated file structure');

    expect(collectFilesSnapshot(dataDir)).toMatchSnapshot('generated files');
  });

  it('respects dryRun option and does not create files', async () => {
    prepareFiles(tempDir, {
      'app/models/user.ts': `
import Model, { attr } from '@ember-data/model';

export default class User extends Model {
  @attr('string') name;
}
`,
    });

    const dryRunOptions: MigrateOptions = { ...options, dryRun: true };
    await runMigration(dryRunOptions);

    const dataDir = join(tempDir, 'app/data');
    expect(collectFileStructure(dataDir)).toMatchSnapshot('dryRun file structure');
  });

  it('creates output directories if they do not exist', async () => {
    prepareFiles(tempDir, {
      'app/models/user.ts': `
import Model, { attr } from '@ember-data/model';

export default class User extends Model {
  @attr('string') name;

  get displayName() {
    return this.name;
  }
}
`,
    });

    const resourcesDirBefore = collectFileStructure(join(tempDir, 'app/data/resources'));
    const extensionsDirBefore = collectFileStructure(join(tempDir, 'app/data/extensions'));
    expect(resourcesDirBefore).toEqual([]);
    expect(extensionsDirBefore).toEqual([]);

    await runMigration(options);

    const dataDir = join(tempDir, 'app/data');
    expect(collectFileStructure(dataDir)).toMatchSnapshot('generated file structure');
  });

  it('respects models-only and mixins-only options', async () => {
    prepareFiles(tempDir, {
      'app/models/user.ts': `
import Model, { attr } from '@ember-data/model';

export default class User extends Model {
  @attr('string') name;
}
`,
      'app/mixins/common.ts': `
import Mixin from '@ember/object/mixin';

export default Mixin.create({
  commonMethod() {}
});
`,
    });

    const modelsOnlyOptions: MigrateOptions = { ...options, modelsOnly: true };
    await runMigration(modelsOnlyOptions);

    const dataDir = join(tempDir, 'app/data');
    expect(collectFileStructure(dataDir)).toMatchSnapshot('models-only file structure');
  });

  it('ensures schema files match source extension and type files are always .ts', async () => {
    prepareFiles(tempDir, {
      'app/models/js-model.js': `
import Model, { attr } from '@ember-data/model';

export default class JsModel extends Model {
  @attr('string') name;
}
`,
      'app/models/ts-model.ts': `
import Model, { attr } from '@ember-data/model';

export default class TsModel extends Model {
  @attr('string') name;
}
`,
    });

    await runMigration(options);

    const dataDir = join(tempDir, 'app/data');
    expect(collectFileStructure(dataDir)).toMatchSnapshot('mixed extensions file structure');
  });

  it('colocates type files with their corresponding schemas and traits', async () => {
    prepareFiles(tempDir, {
      'app/models/admin/nested-model.ts': `
import Model, { attr } from '@ember-data/model';

export default class NestedModel extends Model {
  @attr('string') name;
}
`,
      'app/mixins/admin/connected.ts': `
import Mixin from '@ember/object/mixin';
import { attr } from '@ember-data/model';

export default Mixin.create({
  commonField: attr('string')
});
`,
      'app/models/admin/admin-model.ts': `
import Model, { attr } from '@ember-data/model';
import ConnectedMixin from '../../mixins/admin/connected';

export default class AdminModel extends Model.extend(ConnectedMixin) {
  @attr('string') adminName;
}
`,
    });

    await runMigration({ ...options, verbose: true });

    const dataDir = join(tempDir, 'app/data');
    expect(collectFileStructure(dataDir)).toMatchSnapshot('nested directory structure');

    expect(collectFilesSnapshot(dataDir)).toMatchSnapshot('nested directory files');
  });

  it('does not put type files in the default fallback directory', async () => {
    prepareFiles(tempDir, {
      'app/models/user.ts': `
import Model, { attr } from '@ember-data/model';

export default class User extends Model {
  @attr('string') name;
}
`,
    });

    await runMigration(options);

    const appDir = join(tempDir, 'app');
    expect(collectFileStructure(appDir)).toMatchSnapshot('app directory structure');
  });

  it('handles external mixin imports from additionalMixinSources', async () => {
    prepareFiles(tempDir, {
      'app/models/test-model.ts': `
import Model, { attr } from '@ember-data/model';
import ExternalMixin from '@external/mixins/external-mixin';
import LocalMixin from '../mixins/local-mixin';

export default class TestModel extends Model.extend(ExternalMixin, LocalMixin) {
  @attr('string') name;
}
`,
      'app/mixins/local-mixin.ts': `
import Mixin from '@ember/object/mixin';
import { attr } from '@ember-data/model';

export default Mixin.create({
  localField: attr('string')
});
`,
      'external/mixins/external-mixin.ts': `
import Mixin from '@ember/object/mixin';
import { attr } from '@ember-data/model';

export default Mixin.create({
  externalField: attr('string')
});
`,
    });

    const optionsWithExternal: MigrateOptions = {
      ...options,
      additionalMixinSources: [
        {
          pattern: '@external/mixins/*',
          dir: join(tempDir, 'external/mixins/*'),
        },
      ],
    };

    await runMigration(optionsWithExternal);

    const dataDir = join(tempDir, 'app/data');
    expect(collectFileStructure(dataDir)).toMatchSnapshot('external mixins file structure');

    expect(collectFilesSnapshot(dataDir)).toMatchSnapshot('external mixins files');
  });

  it('handles mixed js and ts files correctly with proper type file extensions', async () => {
    prepareFiles(tempDir, {
      'app/models/js-model-with-mixin.js': `
import Model, { attr } from '@ember-data/model';
import JsMixin from '../mixins/js-mixin';

export default class JsModelWithMixin extends Model.extend(JsMixin) {
  @attr('string') name;

  get displayName() {
    return this.name + ' (JS)';
  }
}
`,
      'app/models/ts-model-with-mixin.ts': `
import Model, { attr } from '@ember-data/model';
import TsMixin from '../mixins/ts-mixin';

export default class TsModelWithMixin extends Model.extend(TsMixin) {
  @attr('string') title;
}
`,
      'app/mixins/js-mixin.js': `
import Mixin from '@ember/object/mixin';
import { attr } from '@ember-data/model';

export default Mixin.create({
  createdAt: attr('date')
});
`,
      'app/mixins/ts-mixin.ts': `
import Mixin from '@ember/object/mixin';
import { attr } from '@ember-data/model';

export default Mixin.create({
  isEnabled: attr('boolean'),

  toggleEnabled() {
    this.set('isEnabled', !this.isEnabled);
  }
});
`,
    });

    await runMigration(options);

    const dataDir = join(tempDir, 'app/data');
    expect(collectFileStructure(dataDir)).toMatchSnapshot('mixed js/ts file structure');

    expect(collectFilesSnapshot(dataDir)).toMatchSnapshot('mixed js/ts files');
  });

  it('processes intermediateModelPaths to generate traits from base model classes', async () => {
    prepareFiles(tempDir, {
      'app/core/data-field-model.ts': `
import BaseModel from './base-model';
import BaseModelMixin from '@external/mixins/base-model-mixin';
import { attr } from '@ember-data/model';

/**
 * Data fields are used to represent information that can be selected via a
 * select list in the UI.
 */
export default class DataFieldModel extends BaseModel.extend(BaseModelMixin) {
  @attr('string') name;
  @attr('number') sortOrder;
}
`,
      'app/core/base-model.ts': `
import Model from '@ember-data/model';

export default class BaseModel extends Model {
}
`,
      'app/models/custom-select-option.js': `
import DataFieldModel from '../core/data-field-model';

export default class CustomSelectOption extends DataFieldModel {
}
`,
      'external/mixins/base-model-mixin.js': `
import Mixin from '@ember/object/mixin';

export default Mixin.create({
  // Base model functionality
});
`,
    });

    const testOptions: MigrateOptions = {
      ...options,
      intermediateModelPaths: ['soxhub-client/core/base-model', 'soxhub-client/core/data-field-model'],
      additionalModelSources: [
        {
          pattern: 'soxhub-client/core/*',
          dir: join(tempDir, 'app/core/*'),
        },
      ],
      additionalMixinSources: [
        {
          pattern: '@external/mixins/*',
          dir: join(tempDir, 'external/mixins/*'),
        },
      ],
    };

    const originalCwd = process.cwd();
    process.chdir(tempDir);

    try {
      await runMigration(testOptions);
    } finally {
      // Restore original working directory
      process.chdir(originalCwd);
    }

    const dataDir = join(tempDir, 'app/data');
    expect(collectFileStructure(dataDir)).toMatchSnapshot('intermediate models file structure');

    const traitsDir = join(tempDir, 'app/data/traits');
    expect(collectFilesSnapshot(traitsDir)).toMatchSnapshot('intermediate models traits');

    const resourcesDir = join(tempDir, 'app/data/resources');
    expect(collectFilesSnapshot(resourcesDir)).toMatchSnapshot('intermediate models resources');
  });

  it('places intermediate model extensions in extensionsDir not fallback directory', async () => {
    prepareFiles(tempDir, {
      'app/core/base-model-with-methods.js': `
import Model, { attr } from '@ember-data/model';

export default class BaseModelWithMethods extends Model {
  @attr('string') baseField;

  // This should create an extension artifact
  get computedValue() {
    return this.baseField + ' computed';
  }

  someMethod() {
    return 'from base model';
  }
}
`,
      'app/models/regular-model.ts': `
import BaseModelWithMethods from '../core/base-model-with-methods';

export default class RegularModel extends BaseModelWithMethods {
}
`,
    });

    const testOptions: MigrateOptions = {
      ...options,
      intermediateModelPaths: ['soxhub-client/core/base-model-with-methods'],
      additionalModelSources: [
        {
          pattern: 'soxhub-client/core/*',
          dir: join(tempDir, 'app/core/*'),
        },
      ],
    };

    const originalCwd = process.cwd();
    process.chdir(tempDir);

    try {
      await runMigration(testOptions);
    } finally {
      // Restore original working directory
      process.chdir(originalCwd);
    }

    const appDir = join(tempDir, 'app');
    expect(collectFileStructure(appDir)).toMatchSnapshot('intermediate model extensions app structure');

    const dataDir = join(tempDir, 'app/data');
    expect(collectFilesSnapshot(dataDir)).toMatchSnapshot('intermediate model extensions files');
  });

  it('ensures resources and traits include .schema with matching suffixes', async () => {
    prepareFiles(tempDir, {
      'app/models/js-test-model.js': `
import Model, { attr } from '@ember-data/model';
import TestMixin from '../mixins/test-mixin';

export default class JsTestModel extends Model.extend(TestMixin) {
  @attr('string') name;

  get displayName() {
    return 'JS: ' + this.name;
  }
}
`,
      'app/models/ts-test-model.ts': `
import Model, { attr } from '@ember-data/model';

export default class TsTestModel extends Model {
  @attr('string') title;
}
`,
      'app/mixins/test-mixin.ts': `
import Mixin from '@ember/object/mixin';
import { attr } from '@ember-data/model';

export default Mixin.create({
  testField: attr('boolean'),

  testMethod() {
    return 'test';
  }
});
`,
    });

    await runMigration(options);

    const dataDir = join(tempDir, 'app/data');
    expect(collectFileStructure(dataDir)).toMatchSnapshot('schema naming file structure');
  });

  it('dynamically detects traits vs resources for import paths', async () => {
    prepareFiles(tempDir, {
      'app/models/test-model.ts': `
import Model, { belongsTo } from '@ember-data/model';
import WorkstreamableMixin from '../mixins/workstreamable';

export default class TestModel extends Model.extend(WorkstreamableMixin) {
  // This should be imported from resources (regular model)
  @belongsTo('user', { async: false }) user;

  // This should be imported from traits (exists as trait)
  @belongsTo('workstreamable', { async: false }) workstreamable;
}
`,
      'app/models/user.ts': `
import Model, { attr } from '@ember-data/model';

export default class User extends Model {
  @attr('string') name;
}
`,
      'app/mixins/workstreamable.ts': `
import Mixin from '@ember/object/mixin';
import { attr } from '@ember-data/model';

export default Mixin.create({
  workstreamType: attr('string')
});
`,
    });

    await runMigration(options);

    const dataDir = join(tempDir, 'app/data');
    expect(collectFileStructure(dataDir)).toMatchSnapshot('traits vs resources file structure');

    expect(collectFilesSnapshot(dataDir)).toMatchSnapshot('traits vs resources files');
  });

  it('mixin with attributes only is ONLY referenced as a trait in a schema', async () => {
    prepareFiles(tempDir, {
      'app/models/test-model.ts': `
import Model, { belongsTo } from '@ember-data/model';
import WorkstreamableMixin from '../mixins/workstreamable';

export default class TestModel extends Model.extend(WorkstreamableMixin) {
  // This should be imported from resources (regular model)
  @belongsTo('user', { async: false }) user;

  // This should be imported from traits (exists as trait)
  @belongsTo('workstreamable', { async: false }) workstreamable;
}
`,
      'app/models/user.ts': `
import Model, { attr } from '@ember-data/model';

export default class User extends Model {
  @attr('string') name;
}
`,
      'app/mixins/workstreamable.ts': `
import Mixin from '@ember/object/mixin';
import { attr } from '@ember-data/model';

export default Mixin.create({
  workstreamType: attr('string')
});
`,
    });

    await runMigration(options);

    const dataDir = join(tempDir, 'app/data');
    expect(collectFilesSnapshot(dataDir)).toMatchSnapshot('contains_only_a_trait');
  });

  it('mixin with both attributes and methods only is referenced as a trait and an objectExtension', async () => {
    prepareFiles(tempDir, {
      'app/models/test-model.ts': `
import Model, { belongsTo } from '@ember-data/model';
import WorkstreamableMixin from '../mixins/workstreamable';

export default class TestModel extends Model.extend(WorkstreamableMixin) {
  // This should be imported from resources (regular model)
  @belongsTo('user', { async: false }) user;

  // This should be imported from traits (exists as trait)
  @belongsTo('workstreamable', { async: false }) workstreamable;
}
`,
      'app/models/user.ts': `
import Model, { attr } from '@ember-data/model';

export default class User extends Model {
  @attr('string') name;
}
`,
      'app/mixins/workstreamable.ts': `
import Mixin from '@ember/object/mixin';
import { attr } from '@ember-data/model';

export default Mixin.create({
  workstreamType: attr('string'),
  imAnObjectExtensionNow() {},
});
`,
    });

    await runMigration(options);

    const dataDir = join(tempDir, 'app/data');
    expect(collectFilesSnapshot(dataDir)).toMatchSnapshot('contains_both_extension_and_a_trait');
  });

  it('ensures type files are always .ts regardless of source file extension', async () => {
    prepareFiles(tempDir, {
      'app/models/js-model.js': `
import Model, { attr } from '@ember-data/model';

export default class JsModel extends Model {
  @attr('string') name;
}
`,
      'app/models/ts-model.ts': `
import Model, { attr } from '@ember-data/model';

export default class TsModel extends Model {
  @attr('string') name;
}
`,
    });

    await runMigration(options);

    const dataDir = join(tempDir, 'app/data');
    expect(collectFileStructure(dataDir)).toMatchSnapshot('type files extension structure');
  });

  it('detects mixins referenced via type-only imports', async () => {
    prepareFiles(tempDir, {
      'app/mixins/auditable.ts': `
import Mixin from '@ember/object/mixin';
import { attr } from '@ember-data/model';

export default Mixin.create({
  auditStatus: attr('string'),
  auditDate: attr('date')
});
`,
      'app/models/audited-record.ts': `
import Model, { attr, belongsTo } from '@ember-data/model';
import type AuditableMixin from '../mixins/auditable';

export default class AuditedRecord extends Model {
  @attr('string') name;
  @belongsTo('user', { async: false }) user;
}
`,
      'app/models/audit-log.ts': `
import Model, { attr } from '@ember-data/model';
import AuditableMixin from '../mixins/auditable';

export default class AuditLog extends Model.extend(AuditableMixin) {
  @attr('string') action;
}
`,
    });

    await runMigration(options);

    const dataDir = join(tempDir, 'app/data');
    expect(collectFileStructure(dataDir)).toMatchSnapshot('type-only import file structure');

    expect(collectFilesSnapshot(dataDir)).toMatchSnapshot('type-only import files');
  });

  it('typed model with multiline declarations', async () => {
    prepareFiles(tempDir, {
      'app/models/typed.ts': `
import Model, { attr, belongsTo, hasMany } from '@ember-data/model';

export default class TestModel extends Model {
  @attr('string') declare name: string | null;
  @belongsTo('user', { async: false, inverse: null })
  declare owner: unknown;
  @hasMany('tag', { async: true, inverse: null })
  declare tags: unknown;
}
`,
    });

    await runMigration(options);
    const dataDir = join(tempDir, 'app/data');
    expect(collectFilesSnapshot(dataDir)).toMatchSnapshot();
  });

  it('model discovery of non-standard ember-data imports', async () => {
    prepareFiles(tempDir, {
      'app/models/typed.ts': `
import Model, { attr, belongsTo, hasMany } from '@unknown/non-standard/model-location';

export default class TestModel extends Model {
  @attr('string') declare name: string | null;
  @belongsTo('user', { async: false, inverse: null })
  declare owner: unknown;
  @hasMany('tag', { async: true, inverse: null })
  declare tags: unknown;
}
`,
    });

    await runMigration({
      ...options,
      emberDataImportSource: '@unknown/non-standard/model-location',
    });
    const dataDir = join(tempDir, 'app/data');
    expect(collectFilesSnapshot(dataDir)['resources/typed.schema.ts']).toBeTruthy();
  });

  it('base-model import ', async () => {
    prepareFiles(tempDir, {
      'app/models/typed.ts': `
import BaseModel from 'test-app/models/base-model';

export default class TestModel extends BaseModel {
  @attr('string') declare name: string | null;
  @belongsTo('user', { async: false, inverse: null })
  declare owner: unknown;
  @hasMany('tag', { async: true, inverse: null })
  declare tags: unknown;
}
`,
    });

    await runMigration({
      ...options,
      importSubstitutes: [
        {
          import: 'test-app/models/base-model',
          extension: 'static-base-model-extension',
          trait: 'static-base-model-trait',
        },
      ],
    });
    const dataDir = join(tempDir, 'app/data');
    expect(collectFilesSnapshot(dataDir)['resources/typed.schema.ts']).toBeTruthy();
    expect(collectFilesSnapshot(dataDir)).toMatchInlineSnapshot(`
      {
        "resources/": "__dir__",
        "resources/typed.ext.ts": "
      import BaseModel from 'test-app/models/base-model';

      import type { TypedTrait } from 'test-app/data/resources/typed.schema';

      export interface TypedExtension extends TypedTrait {}

      export class TypedExtension {
        @attr('string') declare name: string | null

        @belongsTo('user', { async: false, inverse: null })
          declare owner: unknown

        @hasMany('tag', { async: true, inverse: null })
          declare tags: unknown
      }",
        "resources/typed.schema.ts": "
      import type { Type } from '@ember-data/core-types/symbols';
      import type { StaticBaseModelTraitTrait } from 'test-app/data/traits/static-base-model-trait.schema';
      import type { TypedExtension } from 'test-app/data/resources/typed.ext';
      const TypedSchema = {
        'type': 'typed',
        'legacy': true,
        'identity': {
          'kind': '@id',
          'name': 'id'
        },
        'fields': [],
        'traits': [
          'static-base-model-trait'
        ],
        'objectExtensions': [
          'static-base-model-extension'
        ]
      } as const;

      export default TypedSchema;

      export interface TypedTrait {
        readonly [Type]: 'typed';
      }

      export interface Typed extends TypedTrait, TypedExtension, StaticBaseModelTraitTrait {}",
        "traits/": "__dir__",
      }
    `);
  });

  it('base-model import with extension', async () => {
    prepareFiles(tempDir, {
      'app/models/typed.ts': `
import BaseModel from 'test-app/models/base-model.js';

export default class TestModel extends BaseModel {
  @attr('string') declare name: string | null;
  @belongsTo('user', { async: false, inverse: null })
  declare owner: unknown;
  @hasMany('tag', { async: true, inverse: null })
  declare tags: unknown;
}
`,
    });

    await runMigration({
      ...options,
      importSubstitutes: [
        {
          import: 'test-app/models/base-model',
          extension: 'static-base-model-extension',
          trait: 'static-base-model-trait',
        },
      ],
    });
    const dataDir = join(tempDir, 'app/data');
    expect(collectFilesSnapshot(dataDir)['resources/typed.schema.ts']).toBeTruthy();
    expect(collectFilesSnapshot(dataDir)).toMatchInlineSnapshot(`
      {
        "resources/": "__dir__",
        "resources/typed.ext.ts": "
      import BaseModel from 'test-app/models/base-model.js';

      import type { TypedTrait } from 'test-app/data/resources/typed.schema';

      export interface TypedExtension extends TypedTrait {}

      export class TypedExtension {
        @attr('string') declare name: string | null

        @belongsTo('user', { async: false, inverse: null })
          declare owner: unknown

        @hasMany('tag', { async: true, inverse: null })
          declare tags: unknown
      }",
        "resources/typed.schema.ts": "
      import type { Type } from '@ember-data/core-types/symbols';
      import type { StaticBaseModelTraitTrait } from 'test-app/data/traits/static-base-model-trait.schema';
      import type { TypedExtension } from 'test-app/data/resources/typed.ext';
      const TypedSchema = {
        'type': 'typed',
        'legacy': true,
        'identity': {
          'kind': '@id',
          'name': 'id'
        },
        'fields': [],
        'traits': [
          'static-base-model-trait'
        ],
        'objectExtensions': [
          'static-base-model-extension'
        ]
      } as const;

      export default TypedSchema;

      export interface TypedTrait {
        readonly [Type]: 'typed';
      }

      export interface Typed extends TypedTrait, TypedExtension, StaticBaseModelTraitTrait {}",
        "traits/": "__dir__",
      }
    `);
  });

  it('README example: model with mixin, belongsTo, hasMany, and extension methods', async () => {
    prepareFiles(tempDir, {
      'app/models/user.ts': `
import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import Timestampable from '../mixins/timestampable';

export default class User extends Model.extend(Timestampable) {
  @attr('string') declare name: string;
  @attr('string') declare email: string;
  @belongsTo('company', { async: false }) declare company: Company;
  @hasMany('project', { async: true }) declare projects: Project[];

  get displayName() {
    return this.name || this.email;
  }

  async updateProfile(data) {
    this.setProperties(data);
    return this.save();
  }
}
`,
      'app/mixins/timestampable.ts': `
import Mixin from '@ember/object/mixin';
import { attr } from '@ember-data/model';

export default Mixin.create({
  createdAt: attr('date'),
  updatedAt: attr('date'),

  timeSince() {
    return Date.now() - this.updatedAt;
  }
});
`,
    });

    await runMigration(options);

    const dataDir = join(tempDir, 'app/data');
    expect(collectFileStructure(dataDir)).toMatchSnapshot('readme_example_structure');
    expect(collectFilesSnapshot(dataDir)).toMatchSnapshot('readme_example');
  });

  it('regression: ember-data import without default import is respected', async () => {
    prepareFiles(tempDir, {
      'app/models/typed.ts': `
   import { attr, hasMany } from '@ember-data/model';
   import BaseModel from 'soxhub-client/core/base-model';

   export default class MaturityScale extends BaseModel {
    @attr('string') declare name: string;
    @attr('string') declare description: string;
    @attr('boolean') declare isForControlsAssessment: boolean;

    @hasMany('framework', {
     async: false,
     inverse: 'maturityScale',
    })
    declare frameworks: Framework[];
   }
`,
    });

    await runMigration({
      ...options,
      emberDataImportSource: '@ember-data/model',
      importSubstitutes: [
        {
          import: 'soxhub-client/core/base-model',
          extension: 'static-base-model-extension',
          trait: 'static-base-model-trait',
        },
      ],
    });
    const dataDir = join(tempDir, 'app/data');
    expect(collectFilesSnapshot(dataDir)['resources/typed.schema.ts']).toBeTruthy();
    expect(collectFilesSnapshot(dataDir)).toMatchInlineSnapshot(`
      {
        "resources/": "__dir__",
        "resources/typed.schema.ts": "
      import type { Type } from '@ember-data/core-types/symbols';
      import type { Framework } from 'test-app/data/resources/framework.schema';
      import type { HasMany } from '@ember-data/model';
      import type { StaticBaseModelTraitTrait } from 'test-app/data/traits/static-base-model-trait.schema';
      const TypedSchema = {
        'type': 'typed',
        'legacy': true,
        'identity': {
          'kind': '@id',
          'name': 'id'
        },
        'fields': [
          {
            'kind': 'attribute',
            'name': 'name',
            'type': 'string'
          },
          {
            'kind': 'attribute',
            'name': 'description',
            'type': 'string'
          },
          {
            'kind': 'attribute',
            'name': 'isForControlsAssessment',
            'type': 'boolean'
          },
          {
            'kind': 'hasMany',
            'name': 'frameworks',
            'type': 'framework',
            'options': {
              'async': false,
              'inverse': 'maturityScale'
            }
          }
        ],
        'traits': [
          'static-base-model-trait'
        ],
        'objectExtensions': [
          'static-base-model-extension'
        ]
      } as const;

      export default TypedSchema;

      export interface Typed extends StaticBaseModelTraitTrait {
        readonly [Type]: 'typed';
        readonly name: string | null;
        readonly description: string | null;
        readonly isForControlsAssessment: boolean | null;
        readonly frameworks: HasMany<Framework>;
      }",
        "traits/": "__dir__",
      }
    `);
  });
});
