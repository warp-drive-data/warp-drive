import { toArtifacts } from './tests/schema-migration/transforms/model-to-schema.test.js';

const DEFAULT_TEST_OPTIONS = {
  dryRun: false,
  verbose: false,
  debug: false,
  emberDataImportSource: '@ember-data/model',
  typeImportSource: '@warp-drive/core/types/symbols',
  emberDataTypeImportSource: '@ember-data/model',
  modelImportSource: undefined,
  mixinImportSource: undefined,
  modelsDir: './app/models',
  mixinsDir: './app/mixins',
  resourcesDir: undefined,
  traitsDir: undefined,
  extensionsDir: undefined,
  resourcesImport: 'test-app/data/resources',
  traitsImport: undefined,
  extensionsImport: '../extensions'
};

const input = `import Model, { attr } from '@ember-data/model';
import FileableMixin from 'app/mixins/fileable';
import TimestampableMixin from 'app/mixins/timestampable';

export default class Document extends Model.extend(FileableMixin, TimestampableMixin) {
  @attr('string') title;
  @attr('string') content;

  get wordCount() {
    return (this.content || '').split(' ').length;
  }
}`;

try {
  const artifacts = toArtifacts('app/models/document.js', input, DEFAULT_TEST_OPTIONS);
  console.log('Artifacts count:', artifacts.length);
  const schema = artifacts.find(a => a.type === 'schema');
  console.log('Schema code:', schema?.code);
} catch (error) {
  console.error('Error:', error);
}
