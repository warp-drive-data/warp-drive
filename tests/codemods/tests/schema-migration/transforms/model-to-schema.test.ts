import { describe, expect, it } from 'vitest';

import { toArtifacts } from '../../../../../packages/codemods/src/schema-migration/processors/model.js';
import { SchemaArtifact } from '../../../../../packages/codemods/src/schema-migration/utils/artifact.js';
import { parseFile } from '../../../../../packages/codemods/src/schema-migration/utils/file-parser.js';
import { createTestOptions } from '../test-helpers.js';

const COMBINED_OPTIONS = createTestOptions({
  combineSchemasAndTypes: true,
  resourcesImport: 'test-app/data/resources',
  traitsImport: 'test-app/data/traits',
});

function entityFromSource(path: string, source: string, opts = COMBINED_OPTIONS): SchemaArtifact {
  return SchemaArtifact.fromParsedFile(parseFile(path, source, opts));
}

describe('model-to-schema transform (artifacts)', () => {
  describe('basic functionality', () => {
    it('produces schema and extension artifacts for basic model', () => {
      const input = `import Model, { attr, hasMany, belongsTo } from '@ember-data/model';

export default class User extends Model {
	@attr('string') name;
	@attr('string') email;
	@attr('boolean', { defaultValue: false }) isActive;
	@belongsTo('company', { async: false, inverse: null }) company;
	@hasMany('project', { async: true, inverse: 'owner' }) projects;

	get displayName() {
		return this.name || this.email;
	}

	async save() {
		return super.save();
	}
}`;

      const { artifacts } = toArtifacts(
        entityFromSource('app/models/user.js', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );
      // Schema now includes merged types, so we have: schema (with types) + extension
      expect(artifacts).toHaveLength(2);

      // Test artifact metadata
      expect(
        artifacts.map((a) => ({ type: a.type, suggestedFileName: a.suggestedFileName, name: a.name }))
      ).toMatchSnapshot('artifact metadata');

      // Test generated code separately for better readability
      const schema = artifacts.find((a) => a.type === 'schema');
      const extension = artifacts.find((a) => a.type === 'resource-extension');
      expect(schema?.code).toMatchSnapshot('schema code');
      expect(extension?.code).toMatchSnapshot('extension code');
    });

    it('produces only schema artifact when model has no methods or computed properties', () => {
      const input = `import Model, { attr } from '@ember-data/model';

export default class SimpleModel extends Model {
	@attr('string') name;
	@attr('number') count;
}`;

      const { artifacts } = toArtifacts(
        entityFromSource('app/models/simple-model.js', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );
      // Schema now includes merged types, so we only have 1 artifact for data-only models
      expect(artifacts).toHaveLength(1);
      expect(artifacts[0]?.type).toBe('schema');
      expect(artifacts[0]?.name).toBe('SimpleModelSchema');
    });

    it('handles Typescript model with mixins', () => {
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

      const { artifacts } = toArtifacts(
        entityFromSource('app/models/document.ts', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );
      // Schema now includes merged types, so we have: schema (with types) + extension
      expect(artifacts).toHaveLength(2);

      const schema = artifacts.find((a) => a.type === 'schema');
      expect(schema?.code).toContain('Fileable');
      expect(schema?.code).toContain('Timestampable');
      expect(schema?.code).toMatchSnapshot('schema with mixins');
    });

    it('handles model with mixins', () => {
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

      const { artifacts } = toArtifacts(
        entityFromSource('app/models/document.js', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );
      // Schema now includes merged types, so we have: schema (with types) + extension
      expect(artifacts).toHaveLength(2);

      const schema = artifacts.find((a) => a.type === 'schema');
      expect(schema?.code).toContain('fileable');
      expect(schema?.code).toContain('timestampable');
      expect(schema?.code).toMatchSnapshot('schema with mixins');
    });

    it('supports alternate import sources', () => {
      const input = `import Model, { attr, hasMany } from '@auditboard/warp-drive/v1/model';

export default class CustomModel extends Model {
	@attr('string') name;
	@hasMany('item', { async: false }) items;
}`;

      const opts = createTestOptions({
        combineSchemasAndTypes: true,
        resourcesImport: 'test-app/data/resources',
        traitsImport: 'test-app/data/traits',
        emberDataImportSource: '@auditboard/warp-drive/v1/model',
      });
      const { artifacts } = toArtifacts(entityFromSource('app/models/custom-model.js', input, opts), opts);
      // Schema now includes merged types, so we only have 1 artifact for data-only models
      expect(artifacts).toHaveLength(1);
      expect(artifacts[0]?.type).toBe('schema');
      expect(artifacts[0]?.code).toMatchSnapshot('custom import source');
    });

    it('handles complex field options correctly', () => {
      const input = `import Model, { attr, belongsTo, hasMany } from '@ember-data/model';

export default class ComplexModel extends Model {
	@attr('string', { defaultValue: 'default' }) name;
	@attr('date', { allowNull: true }) birthDate;
	@belongsTo('user', { async: true, inverse: 'profile', polymorphic: true }) owner;
	@hasMany('file', { async: false, inverse: null, as: 'fileable' }) attachments;
}`;

      const { artifacts } = toArtifacts(
        entityFromSource('app/models/complex-model.js', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );
      // Schema now includes merged types, so we only have 1 artifact for data-only models
      expect(artifacts).toHaveLength(1);
      expect(artifacts[0]?.code).toMatchSnapshot('complex field options');
    });

    it('preserves TypeScript syntax in extension properties', () => {
      const input = `import Model, { attr } from '@ember-data/model';
import { service } from '@ember/service';

export default class TypedModel extends Model {
	@service declare router: RouterService;
	@attr('string') declare name: string;

	complexMethod(): Promise<void> {
		return new Promise(resolve => {
			setTimeout(() => resolve(), 1000);
		});
	}

	get computedValue(): string {
		return \`Processed: \${this.name}\`;
	}
}`;

      const { artifacts } = toArtifacts(
        entityFromSource('app/models/typed-model.ts', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );
      // Schema now includes merged types, so we have: schema (with types) + extension
      expect(artifacts).toHaveLength(2);

      const extension = artifacts.find((a) => a.type === 'resource-extension');
      expect(extension?.code).toMatchSnapshot('typescript extension');
    });

    it('correctly extracts kebab-case file names to schema types', () => {
      const input = `import Model, { attr } from '@ember-data/model';

export default class ProjectPlan extends Model {
	@attr('string') title;
}`;

      const { artifacts } = toArtifacts(
        entityFromSource('app/models/project-plan.js', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );
      // Schema now includes merged types, so we only have 1 artifact for data-only models
      expect(artifacts).toHaveLength(1);
      expect(artifacts[0]?.name).toBe('ProjectPlanSchema');
      expect(artifacts[0]?.suggestedFileName).toBe('project-plan.schema.ts');
      // Verify the schema is valid by checking both structure and content
      expect(artifacts[0]?.code).toContain("'type': 'project-plan'");
      expect(artifacts[0]?.code).toContain('export default ProjectPlanSchema');
      expect(artifacts[0]?.code).toContain("'name': 'title'");
    });
  });

  describe('fragment handling', () => {
    it('handles fragment decorator correctly inside of models', () => {
      const input = `import Model, { attr } from '@ember-data/model';
import { fragment } from 'ember-data-model-fragments/attributes';

export default class FragmentModel extends Model {
	@attr('string') name;
  @fragment('address') address;
}`;

      const { artifacts } = toArtifacts(
        entityFromSource('app/models/fragment-model.js', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );
      // Schema now includes merged types, so we only have 1 artifact for data-only models
      expect(artifacts).toHaveLength(1);
      expect(artifacts[0]?.name).toBe('FragmentModelSchema');
      expect(artifacts[0]?.suggestedFileName).toBe('fragment-model.schema.ts');
      expect(artifacts[0]?.code).toContain("'type': 'fragment-model'");
      expect(artifacts[0]?.code).toContain('export default FragmentModelSchema');

      // Check fragment field uses withFragmentDefaults format
      expect(artifacts[0]?.code).toContain("'name': 'address'");
      expect(artifacts[0]?.code).toContain("'kind': 'schema-object'");
      expect(artifacts[0]?.code).toContain("'type': 'fragment:address'");
      expect(artifacts[0]?.code).toContain("'objectExtensions'");
      expect(artifacts[0]?.code).toContain("'ember-object'");
      expect(artifacts[0]?.code).toContain("'fragment'");
    });

    it('handles classes extending Fragment base class', () => {
      const input = `import Fragment, { attr } from 'ember-data-model-fragments/fragment';

export default class Address extends Fragment {
  @attr('string') street;
  @attr('string') city;
  @attr('string') state;
  @attr('string') zip;
}`;

      const { artifacts } = toArtifacts(
        entityFromSource('app/models/address.js', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );
      // Schema now includes merged types, so we only have 1 artifact for data-only models
      expect(artifacts).toHaveLength(1);
      expect(artifacts[0]?.name).toBe('AddressSchema');
      expect(artifacts[0]?.suggestedFileName).toBe('address.schema.ts');
      expect(artifacts[0]?.code).toContain('export default AddressSchema');

      // Fragment classes should have different schema structure
      expect(artifacts[0]?.code).toContain("'type': 'fragment:address'"); // type is fragment:{name}
      expect(artifacts[0]?.code).toContain("'identity': null"); // identity is null
      expect(artifacts[0]?.code).toContain("'objectExtensions'"); // has objectExtensions
      expect(artifacts[0]?.code).toContain("'ember-object'");
      expect(artifacts[0]?.code).toContain("'fragment'");

      // Check fields are properly extracted
      expect(artifacts[0]?.code).toContain("'name': 'street'");
      expect(artifacts[0]?.code).toContain("'name': 'city'");
      expect(artifacts[0]?.code).toContain("'name': 'state'");
      expect(artifacts[0]?.code).toContain("'name': 'zip'");
    });

    it('handles classes extending intermediate fragment classes (relative path)', () => {
      const input = `import Fragment from 'ember-data-model-fragments/fragment';
import BaseFragment from './base-fragment';
import { attr } from 'ember-data-model-fragments/fragment';

export default class Address extends BaseFragment {
  @attr('string') street;
  @attr('string') city;
}`;

      const opts = createTestOptions({
        combineSchemasAndTypes: true,
        resourcesImport: 'test-app/data/resources',
        traitsImport: 'test-app/data/traits',
        intermediateFragmentPaths: ['./base-fragment', 'base-fragment'],
      });
      const { artifacts } = toArtifacts(entityFromSource('app/models/address.js', input, opts), opts);

      // Schema now includes merged types, so we only have 1 artifact for data-only models
      expect(artifacts).toHaveLength(1);
      expect(artifacts[0]?.name).toBe('AddressSchema');

      // Should still be treated as a Fragment (with fragment schema structure)
      expect(artifacts[0]?.code).toContain("'type': 'fragment:address'");
      expect(artifacts[0]?.code).toContain("'identity': null");
      expect(artifacts[0]?.code).toContain("'objectExtensions'");
      expect(artifacts[0]?.code).toContain("'ember-object'");
      expect(artifacts[0]?.code).toContain("'fragment'");
    });

    it('handles classes extending intermediate fragment classes (absolute module path)', () => {
      const input = `import BaseFragment from 'codemod/models/base-fragment';
import { attr } from '@ember-data/model';

export default class Address extends BaseFragment {
  @attr('string') street;
  @attr('string') city;
  @attr('string') state;
  @attr('string') zip;
}`;

      const opts = createTestOptions({
        combineSchemasAndTypes: true,
        resourcesImport: 'test-app/data/resources',
        traitsImport: 'test-app/data/traits',
        intermediateFragmentPaths: ['codemod/models/base-fragment'],
      });
      const { artifacts } = toArtifacts(entityFromSource('/Users/test/codemod/models/address.js', input, opts), opts);

      // Schema now includes merged types, so we only have 1 artifact for data-only models
      expect(artifacts).toHaveLength(1);
      expect(artifacts[0]?.name).toBe('AddressSchema');
      expect(artifacts[0]?.suggestedFileName).toBe('address.schema.ts');

      // Should be treated as a Fragment (with fragment schema structure)
      expect(artifacts[0]?.code).toContain("'type': 'fragment:address'");
      expect(artifacts[0]?.code).toContain("'identity': null");
      expect(artifacts[0]?.code).toContain("'objectExtensions'");
      expect(artifacts[0]?.code).toContain("'ember-object'");
      expect(artifacts[0]?.code).toContain("'fragment'");

      // Check fields are properly extracted
      expect(artifacts[0]?.code).toContain("'name': 'street'");
      expect(artifacts[0]?.code).toContain("'name': 'city'");
      expect(artifacts[0]?.code).toContain("'name': 'state'");
      expect(artifacts[0]?.code).toContain("'name': 'zip'");
    });

    it('handles fragmentArray correctly inside of models', () => {
      const input = `import Model, { attr } from '@ember-data/model';
import { fragmentArray } from 'ember-data-model-fragments/attributes';

export default class FragmentArrayModel extends Model {
	@attr('string') name;
  @fragmentArray('address') addresses;
}`;

      const { artifacts } = toArtifacts(
        entityFromSource('app/models/fragment-array-model.js', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );
      // Schema now includes merged types, so we only have 1 artifact for data-only models
      expect(artifacts).toHaveLength(1);
      expect(artifacts[0]?.name).toBe('FragmentArrayModelSchema');
      expect(artifacts[0]?.suggestedFileName).toBe('fragment-array-model.schema.ts');
      expect(artifacts[0]?.code).toContain("'type': 'fragment-array-model'");
      expect(artifacts[0]?.code).toContain('export default FragmentArrayModelSchema');

      // Check fragmentArray field uses withFragmentArrayDefaults format
      expect(artifacts[0]?.code).toContain("'name': 'addresses'");
      expect(artifacts[0]?.code).toContain("'kind': 'schema-array'");
      expect(artifacts[0]?.code).toContain("'type': 'fragment:address'");
      expect(artifacts[0]?.code).toContain("'arrayExtensions'");
      expect(artifacts[0]?.code).toContain("'ember-object'");
      expect(artifacts[0]?.code).toContain("'ember-array-like'");
      expect(artifacts[0]?.code).toContain("'fragment-array'");
      expect(artifacts[0]?.code).toContain("'defaultValue': true");
    });

    it('handles array correctly inside of models', () => {
      const input = `import Model, { attr } from '@ember-data/model';
import { array } from 'ember-data-model-fragments/attributes';

export default class ArrayModel extends Model {
	@attr('string') name;
  @array() tags;
}`;

      const { artifacts } = toArtifacts(
        entityFromSource('app/models/array-model.js', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );
      // Schema now includes merged types, so we only have 1 artifact for data-only models
      expect(artifacts).toHaveLength(1);
      expect(artifacts[0]?.name).toBe('ArrayModelSchema');
      expect(artifacts[0]?.suggestedFileName).toBe('array-model.schema.ts');
      expect(artifacts[0]?.code).toContain("'type': 'array-model'");
      expect(artifacts[0]?.code).toContain('export default ArrayModelSchema');

      // Check array field uses withArrayDefaults format
      expect(artifacts[0]?.code).toContain("'name': 'tags'");
      expect(artifacts[0]?.code).toContain("'kind': 'array'");
      expect(artifacts[0]?.code).toContain("'type': 'array:tags'");
      expect(artifacts[0]?.code).toContain("'arrayExtensions'");
      expect(artifacts[0]?.code).toContain("'ember-object'");
      expect(artifacts[0]?.code).toContain("'ember-array-like'");
      expect(artifacts[0]?.code).toContain("'fragment-array'");
      // array decorator does not include defaultValue: true
      expect(artifacts[0]?.code).not.toContain("'defaultValue'");
    });
  });

  describe('edge cases', () => {
    it('skips files that do not import from model sources', () => {
      const input = `import Component from '@glimmer/component';

export default class NotAModel extends Component {
	@attr('string') name;
}`;

      const { artifacts } = toArtifacts(
        entityFromSource('app/components/not-a-model.js', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );
      expect(artifacts).toHaveLength(0);
    });

    it('skips files that do not extend Model', () => {
      const input = `import Model, { attr } from '@ember-data/model';
import EmberObject from '@ember/object';

export default class NotExtendingModel extends EmberObject {
	@attr('string') name;
}`;

      const { artifacts } = toArtifacts(
        entityFromSource('app/models/not-extending-model.js', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );
      expect(artifacts).toHaveLength(0);
    });

    it('handles models with no fields gracefully', () => {
      const input = `import Model from '@ember-data/model';

export default class EmptyModel extends Model {
}`;

      const { artifacts } = toArtifacts(
        entityFromSource('app/models/empty-model.js', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );
      // Empty models still generate a schema artifact (with just identity) - types are now merged
      expect(artifacts).toHaveLength(1);
      expect(artifacts[0]?.type).toBe('schema');
      expect(artifacts[0]?.code).toContain('export default EmptyModelSchema');
    });

    it('handles aliased imports correctly', () => {
      const input = `import Model, { attr as attribute, hasMany as manyRelation } from '@ember-data/model';

export default class AliasedModel extends Model {
	@attribute('string') name;
	@manyRelation('item') items;
}`;

      const { artifacts } = toArtifacts(
        entityFromSource('app/models/aliased-model.js', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );
      // Schema now includes merged types, so we only have 1 artifact for data-only models
      expect(artifacts).toHaveLength(1);
      expect(artifacts[0]?.code).toMatchSnapshot('aliased imports');
    });

    it('ignores decorators from unsupported sources', () => {
      const input = `import Model, { attr } from '@ember-data/model';
import { customDecorator } from '@unsupported/source';

export default class MixedSourceModel extends Model {
	@attr('string') name;
	@customDecorator items; // Should be ignored and moved to extension
}`;

      const { artifacts } = toArtifacts(
        entityFromSource('app/models/mixed-source-model.js', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );
      // Schema now includes merged types, so we have: schema (with types) + extension
      expect(artifacts).toHaveLength(2);

      const schema = artifacts.find((a) => a.type === 'schema');
      const extension = artifacts.find((a) => a.type === 'resource-extension');

      // Only 'name' should be in schema, not 'items'
      expect(schema?.code).toContain("'name': 'name'");
      expect(schema?.code).not.toContain('items');

      // Verify the schema is valid by checking structure
      expect(schema?.code).toContain('export default MixedSourceModelSchema');
      expect(schema?.code).toContain("'type': 'mixed-source-model'");

      // 'items' should be in extension
      expect(extension?.code).toContain('items');
    });

    it.skip('handles models extending base classes correctly', () => {
      const input = `import BaseModel from 'soxhub-client/core/base-model';
import BaseModelMixin from '@auditboard/client-core/mixins/base-model';
import { attr } from '@ember-data/model';

export default class AuditBoardModel extends BaseModel.extend(BaseModelMixin) {
	@attr('string') name;
	@attr('number') id;
}`;

      const { artifacts } = toArtifacts(
        entityFromSource('app/models/auditboard-model.js', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );
      expect(artifacts).toHaveLength(1);
      expect(artifacts[0]?.code).toMatchSnapshot('base model extension');
    });

    it('preserves complex object literal options', () => {
      const input = `import Model, { belongsTo } from '@ember-data/model';

export default class ComplexOptionsModel extends Model {
	@belongsTo('user', {
		async: true,
		inverse: 'profile',
		polymorphic: false,
		resetOnRemoteUpdate: false
	}) owner;
}`;

      const { artifacts } = toArtifacts(
        entityFromSource('app/models/complex-options-model.js', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );
      // Schema now includes merged types, so we only have 1 artifact for data-only models
      expect(artifacts).toHaveLength(1);
      expect(artifacts[0]?.code).toMatchSnapshot('complex options');
    });
  });

  describe('mixin handling', () => {
    it('extracts mixin names and converts them to trait references', () => {
      const input = `import Model, { attr } from '@ember-data/model';
import FileableMixin from '../mixins/fileable';

export default class Document extends Model.extend(FileableMixin) {
	@attr('string') title;
}`;

      const { artifacts } = toArtifacts(
        entityFromSource('app/models/document.js', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );
      // Schema now includes merged types, so we only have 1 artifact for data-only models
      expect(artifacts).toHaveLength(1);

      const schema = artifacts.find((a) => a.type === 'schema');
      expect(schema?.code).toMatchSnapshot('single mixin schema');
    });

    it('handles multiple mixins correctly', () => {
      const input = `import Model, { attr } from '@ember-data/model';
import FileableMixin from '../mixins/fileable';
import TimestampableMixin from '../mixins/timestampable';
import AuditableMixin from '../mixins/auditable';

export default class ComplexDocument extends Model.extend(FileableMixin, TimestampableMixin, AuditableMixin) {
	@attr('string') title;
}`;

      const { artifacts } = toArtifacts(
        entityFromSource('app/models/complex-document.js', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );
      // Schema now includes merged types, so we only have 1 artifact for data-only models
      expect(artifacts).toHaveLength(1);

      const schema = artifacts.find((a) => a.type === 'schema');
      expect(schema?.code).toMatchSnapshot('multiple mixins schema');
    });
  });

  describe('TypeScript type artifacts', () => {
    it('generates schema with merged types for basic models', () => {
      const input = `import Model, { attr, hasMany, belongsTo } from '@ember-data/model';

export default class User extends Model {
	@attr('string') name;
	@attr('boolean', { defaultValue: false }) isActive;
	@belongsTo('company', { async: false }) company;
	@hasMany('project', { async: true }) projects;
}`;

      const { artifacts } = toArtifacts(
        entityFromSource('app/models/user.js', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );

      // Types are now merged into schema, so we only have 1 artifact for data-only models
      expect(artifacts).toHaveLength(1);
      expect(artifacts[0]?.type).toBe('schema');

      // The schema file now includes the type interface
      const schema = artifacts.find((a) => a.type === 'schema');
      expect(schema?.code).toMatchSnapshot('basic schema with merged types');
      expect(schema?.suggestedFileName).toBe('user.schema.ts');
    });

    it('generates schema and extension artifacts when model has methods and computed properties', () => {
      const input = `import Model, { attr } from '@ember-data/model';

export default class ProcessedModel extends Model {
	@attr('string') name;
	@attr('string') content;

	get displayName() {
		return \`Processed: \${this.name}\`;
	}

	processContent() {
		return (this.content || '').toUpperCase();
	}
}`;

      const { artifacts } = toArtifacts(
        entityFromSource('app/models/processed-model.js', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );

      // Types are now merged into schema, so we have: schema (with types) + extension
      expect(artifacts).toHaveLength(2);
      expect(artifacts.map((a) => a.type).sort()).toEqual(['resource-extension', 'schema']);

      const schema = artifacts.find((a) => a.type === 'schema');
      const extension = artifacts.find((a) => a.type === 'resource-extension');

      expect(schema?.code).toMatchSnapshot('model schema with merged types');
      expect(extension?.code).toMatchSnapshot('model extension code');
      expect(schema?.suggestedFileName).toBe('processed-model.schema.ts');
      expect(extension?.suggestedFileName).toBe('processed-model.ext.js');
    });

    it('handles custom type mappings in merged schema files', () => {
      const input = `import Model, { attr } from '@ember-data/model';

export default class TypedModel extends Model {
	@attr('uuid') id;
	@attr('currency') amount;
	@attr('json') metadata;
}`;

      const customTypeMappings = {
        uuid: 'string',
        currency: 'number',
        json: 'Record<string, unknown>',
      };

      const opts = createTestOptions({
        combineSchemasAndTypes: true,
        resourcesImport: 'test-app/data/resources',
        traitsImport: 'test-app/data/traits',
        typeMapping: customTypeMappings,
      });
      const { artifacts } = toArtifacts(entityFromSource('app/models/typed-model.js', input, opts), opts);
      // Types are now merged into schema
      const schema = artifacts.find((a) => a.type === 'schema');

      expect(schema?.code).toMatchSnapshot('custom type mappings in merged schema');
    });

    it('handles relationship types correctly in merged schema files', () => {
      const input = `import Model, { attr, belongsTo, hasMany } from '@ember-data/model';

export default class RelationshipModel extends Model {
	@attr('string') name;
	@belongsTo('user', { async: false }) owner;
	@belongsTo('company', { async: true }) company;
	@hasMany('file', { async: false }) attachments;
	@hasMany('tag', { async: true }) tags;
}`;

      const { artifacts } = toArtifacts(
        entityFromSource('app/models/relationship-model.js', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );
      // Types are now merged into schema
      const schema = artifacts.find((a) => a.type === 'schema');

      expect(schema?.code).toMatchSnapshot('relationship types in merged schema');
    });

    it('uses unknown type for unsupported transforms', () => {
      const input = `import Model, { attr } from '@ember-data/model';

export default class UnknownTypesModel extends Model {
	@attr('custom-transform') customField;
	@attr('another-unknown') anotherField;
	@attr('string') knownField;
}`;

      const { artifacts } = toArtifacts(
        entityFromSource('app/models/unknown-types-model.ts', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );
      // Types are now merged into schema
      const schema = artifacts.find((a) => a.type === 'schema');

      expect(schema?.code).toMatchSnapshot('unknown types in merged schema');
      expect(schema?.code).toContain('unknown');
    });
  });

  describe('custom type mappings', () => {
    it('applies custom type mappings to attribute types', () => {
      const input = `import Model, { attr } from '@ember-data/model';

export default class CustomTypesModel extends Model {
	@attr('uuid') id;
	@attr('timestamp') createdAt;
	@attr('currency') price;
}`;

      const customTypeMappings = {
        uuid: 'string',
        timestamp: 'Date',
        currency: 'number',
      };

      const opts = createTestOptions({
        combineSchemasAndTypes: true,
        resourcesImport: 'test-app/data/resources',
        traitsImport: 'test-app/data/traits',
        typeMapping: customTypeMappings,
      });
      const { artifacts } = toArtifacts(entityFromSource('app/models/custom-types-model.js', input, opts), opts);
      // Types are now merged into schema
      const schema = artifacts.find((a) => a.type === 'schema');

      expect(schema?.code).toMatchSnapshot('custom type mappings in merged schema');
    });

    it('falls back to unknown for unmapped custom types', () => {
      const input = `import Model, { attr } from '@ember-data/model';

export default class UnmappedTypesModel extends Model {
	@attr('unknown-transform') field1;
	@attr('another-unknown') field2;
}`;

      const { artifacts } = toArtifacts(
        entityFromSource('app/models/unmapped-types-model.js', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );
      // Types are now merged into schema
      const schema = artifacts.find((a) => a.type === 'schema');

      expect(schema?.code).toMatchSnapshot('unknown fallback for unmapped types');
      expect(schema?.code).toContain('unknown');
    });
  });

  describe('mirror flag', () => {
    it('uses configured emberDataImportSource for HasMany types in merged schema', () => {
      const input = `import Model, { attr, hasMany, belongsTo } from '@auditboard/warp-drive/v1/model';

export default class RelationshipModel extends Model {
  @attr('string') name;
  @hasMany('tag', { async: false }) tags;
  @hasMany('project', { async: true }) projects;
  @belongsTo('user', { async: false }) owner;
}`;

      const opts = createTestOptions({
        combineSchemasAndTypes: true,
        resourcesImport: 'test-app/data/resources',
        traitsImport: 'test-app/data/traits',
        emberDataImportSource: '@auditboard/warp-drive/v1/model',
        warpDriveImports: 'mirror',
      });
      const { artifacts } = toArtifacts(entityFromSource('app/models/relationship-model.js', input, opts), opts);

      // Types are now merged into schema
      const schema = artifacts.find((a) => a.type === 'schema');

      expect(artifacts.length).toBeGreaterThan(0);
      if (!schema) {
        throw new Error('Test failed: schema must exist');
      }

      expect(schema.code).toMatchSnapshot('custom EmberData source for HasMany types in merged schema');
      expect(schema.code).toContain('hasMany');
      expect(schema.code).not.toContain('@ember-data/model');
    });
  });

  describe('relative imports transformation', () => {
    it('transforms relative model imports to schema type imports when converting a model', () => {
      const input = `import type { ConnectedEntityType } from 'soxhub-client/components/module-automations/const/automation-workflow-instance';
import Model, { attr, belongsTo } from '@ember-data/model';
import type AuditableEntity from './auditable-entity';
import type AutomationWorkflowVersion from './automation-workflow-version';
export default class TestModel extends Model {
  @attr('string') name;
  @belongsTo('auditable-entity', { async: false }) auditableEntity;
  @belongsTo('automation-workflow-version', { async: false }) version;
}`;

      const { artifacts } = toArtifacts(
        entityFromSource('app/models/test.ts', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );
      const schema = artifacts.find((a) => a.type === 'schema');
      expect(schema).toBeDefined();
      const result = schema!.code;

      // Should transform relative type imports to schema resource imports
      expect(result).toContain(
        "import type { AuditableEntity } from 'test-app/data/resources/auditable-entity.schema.ts';"
      );
      expect(result).toContain(
        "import type { AutomationWorkflowVersion } from 'test-app/data/resources/automation-workflow-version.schema.ts';"
      );

      // Should not contain bad import paths with double extensions
      expect(result).not.toContain('.ts.schema');
      expect(result).not.toContain('.js.schema');

      // Should not retain original default type imports
      expect(result).not.toContain("import type AuditableEntity from './auditable-entity';");
      expect(result).not.toContain("import type AutomationWorkflowVersion from './automation-workflow-version';");

      // Should convert the model to a schema
      expect(result).toContain('export default TestSchema');
    });

    it('only transforms type imports with relative paths', () => {
      const input = `import { someFunction } from './some-utility';
import Model, { attr } from '@ember-data/model';
import type SomeType from './some-type';
import RegularImport from './regular-import';
import type { NamedType } from './named-type';
import type AbsoluteType from 'some-package/type';
export default class TestModel extends Model {
  @attr('string') name;
}`;

      const { artifacts } = toArtifacts(
        entityFromSource('app/models/test.ts', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );
      const schema = artifacts.find((a) => a.type === 'schema');
      expect(schema).toBeDefined();
      const result = schema!.code;

      // Non-relationship type imports should not appear in generated schema
      expect(result).not.toContain('SomeType');
      expect(result).not.toContain('someFunction');
      expect(result).not.toContain('RegularImport');
      expect(result).not.toContain('NamedType');
      expect(result).not.toContain('AbsoluteType');

      // Should still generate the schema
      expect(result).toContain('export default TestSchema');
    });
  });

  describe('trait import aliasing', () => {
    it('generates aliased trait imports for backward compatibility', () => {
      const input = `import Model, { belongsTo } from '@ember-data/model';
import WorkstreamableMixin from '../mixins/workstreamable';

export default class TestModel extends Model.extend(WorkstreamableMixin) {
  @belongsTo('workstreamable', { async: false }) workstreamable;
}`;

      const opts = createTestOptions({
        combineSchemasAndTypes: true,
        resourcesImport: 'test-app/data/resources',
        traitsImport: 'test-app/data/traits',
      });
      const { artifacts } = toArtifacts(entityFromSource('app/models/test-model.js', input, opts), opts);

      const schemaType = artifacts.find((a) => a.type === 'schema');

      expect(artifacts.length).toBeGreaterThan(0);
      expect(schemaType).toBeDefined();
      if (!schemaType) {
        throw new Error('Test failed: schema type must exist');
      }

      expect(schemaType.code).toMatchInlineSnapshot(`
        "import { withDefaults } from '@ember-data/model/migration-support';

        import type { Type } from '@warp-drive/core-types/symbols';
        import type { WithLegacy } from '@ember-data/model/migration-support';
        import type { Workstreamable } from 'test-app/data/resources/workstreamable.schema.ts';
        import type { WorkstreamableTrait } from 'test-app/data/traits/workstreamable.schema';

        const TestModelSchema = withDefaults({
          'type': 'test-model',
          'fields': [
            {
              'kind': 'belongsTo',
              'name': 'workstreamable',
              'type': 'workstreamable',
              'options': {
                'async': false
              }
            }
          ],
          'traits': [
            'workstreamable'
          ]
        });

        export default TestModelSchema;

        /**
         * This type represents the full set schema derived fields of
         * the 'test-model' resource, without any of the legacy mode features
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
         * See also {@link TestModel} for fields + legacy mode features
         */
        export interface TestModelResource extends WorkstreamableTrait {
          readonly [Type]: 'test-model';
          id: string | null;
          workstreamable: Workstreamable | null;
        }

        /**
         * This type represents the full set schema derived fields of
         * the 'test-model' resource, including all legacy mode features but
         * without any extensions.
         *
         * See also {@link TestModelResource} for just the fields
         */
        export interface TestModel extends WithLegacy<TestModelResource> {}
        "
      `);
    });
  });

  describe('utility function handling', () => {
    it('excludes utility functions from schema files', () => {
      const input = `import Model, { attr, hasMany } from '@ember-data/model';

function buildFullName(first, last) {
  return \`\${first} \${last}\`;
}

export function formatDate(date) {
  return date.toISOString();
}

export default class User extends Model {
  @attr('string') firstName;
  @attr('string') lastName;
  @hasMany('post') posts;

  get fullName() {
    return buildFullName(this.firstName, this.lastName);
  }
}`;

      const { artifacts } = toArtifacts(
        entityFromSource('app/models/user.js', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );
      const schema = artifacts.find((a) => a.type === 'schema');

      // Schema should not contain utility functions
      expect(schema?.code).not.toContain('function buildFullName');
      expect(schema?.code).not.toContain('export function formatDate');

      // Schema should only contain the schema export and type imports
      expect(schema?.code).toContain('export default UserSchema');
      expect(schema?.code).not.toContain('get fullName');
      expect(schema?.code).not.toContain('function buildFullName');
      expect(schema?.code).not.toContain('export function formatDate');
    });

    it('preserves utility functions in extension files', () => {
      const input = `import Model, { attr } from '@ember-data/model';

function helperFunction(value) {
  return value.toUpperCase();
}

export default class Product extends Model {
  @attr('string') name;

  processName() {
    return helperFunction(this.name);
  }
}`;

      const { artifacts } = toArtifacts(
        entityFromSource('app/models/product.js', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );
      const extension = artifacts.find((a) => a.type === 'resource-extension');

      // Extension should contain the method and helper function
      expect(extension?.code).toContain('processName()');
      expect(extension?.code).toContain('function helperFunction');
      expect(extension?.code).toContain('return helperFunction(this.name)');
    });

    it('updates relative imports when moving utility functions to extension files', () => {
      const input = `import Model, { attr } from '@ember-data/model';
import type SomeType from './some-type';
import AnotherType from '../shared/another-type';
import { GlobalUtil } from 'global-package';
import { helperUtil } from './utils/helper';

function helperFunction(value: SomeType): string {
  return value.name.toUpperCase();
}

export default class Product extends Model {
  @attr('string') name;

  processName() {
    return helperFunction(this.someValue);
  }
}`;

      const { artifacts } = toArtifacts(
        entityFromSource('app/models/product.js', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );
      const extension = artifacts.find((a) => a.type === 'resource-extension');

      // Extension should normalize relative imports to reference the configured package source
      expect(extension?.code).toContain("import type SomeType from 'test-app/models/some-type';");
      expect(extension?.code).toContain("import { helperUtil } from 'test-app/models/utils/helper';");
      expect(extension?.code).toContain("import AnotherType from '../../shared/another-type';");
      // Absolute imports should remain unchanged
      expect(extension?.code).toContain("import { GlobalUtil } from 'global-package';");
      expect(extension?.code).toContain('function helperFunction');
    });

    it('uses directory import mapping for relative imports when configured', () => {
      const input = `import Model, { attr } from '@ember-data/model';
import type Translation from './translation';
import { CoreUtil } from './core/utils';

function helperFunction(value: Translation): string {
  return value.text.toUpperCase();
}

export default class Translatable extends Model {
  @attr('string') text;

  processText() {
    return helperFunction(this);
  }
}`;

      const optionsWithMapping = createTestOptions({
        combineSchemasAndTypes: true,
        resourcesImport: 'test-app/data/resources',
        traitsImport: 'test-app/data/traits',
        directoryImportMapping: {
          'client-core/models': '@auditboard/client-core/models',
          'shared-lib/models': '@company/shared-lib/models',
        },
      });

      const { artifacts } = toArtifacts(
        entityFromSource('client-core/models/translatable.js', input, optionsWithMapping),
        optionsWithMapping
      );
      const extension = artifacts.find((a) => a.type === 'resource-extension');

      // Should use directory mapping instead of modelImportSource
      expect(extension?.code).toContain("import type Translation from '@auditboard/client-core/models/translation';");
      expect(extension?.code).toContain("import { CoreUtil } from '@auditboard/client-core/models/core/utils';");
      expect(extension?.code).toContain('function helperFunction');
    });

    it('handles parent directory imports with directory mapping', () => {
      const input = `import Model, { attr } from '@ember-data/model';
import type { TranslatableModel } from '../types/models/translatable-model';
import { BaseValidator } from '../validators/base-validator';
import SharedUtil from '../../shared/utils';

function processTranslatable(model: TranslatableModel): string {
  return model.text.toUpperCase();
}

export default class Translatable extends Model {
  @attr('string') text;

  validate() {
    return BaseValidator.validate(this);
  }
}`;

      const optionsWithMapping = createTestOptions({
        combineSchemasAndTypes: true,
        resourcesImport: 'test-app/data/resources',
        traitsImport: 'test-app/data/traits',
        directoryImportMapping: {
          'client-core/package/src': '@auditboard/client-core',
        },
      });

      const { artifacts } = toArtifacts(
        entityFromSource('client-core/package/src/models/translatable.js', input, optionsWithMapping),
        optionsWithMapping
      );
      const extension = artifacts.find((a) => a.type === 'resource-extension');

      // Should resolve ../types/models/translatable-model to @auditboard/client-core/types/models/translatable-model
      expect(extension?.code).toContain(
        "import type { TranslatableModel } from '@auditboard/client-core/types/models/translatable-model';"
      );
      // Should resolve ../validators/base-validator to @auditboard/client-core/validators/base-validator
      expect(extension?.code).toContain(
        "import { BaseValidator } from '@auditboard/client-core/validators/base-validator';"
      );
      // Should resolve ../../shared/utils to @auditboard/client-core/shared/utils
      expect(extension?.code).toContain("import SharedUtil from '@auditboard/client-core/shared/utils';");
      expect(extension?.code).toContain('function processTranslatable');
    });
  });

  describe('memberAction handling', () => {
    it('does not extract after methods from memberAction calls', () => {
      const input = `
        import Model, { attr } from '@ember-data/model';
        import { memberAction } from 'test-app/decorators/api-actions';

        export default class TestModel extends Model {
          @attr('string') name;

          startProcess = memberAction({
            path: 'start_process',
            type: 'POST',
            after(this: TestModel, response: TestModel): TestModel {
              console.log('Process started');
              return response;
            }
          });

          finishProcess = memberAction({
            path: 'finish_process',
            type: 'POST',
            after(response: any): void {
              this.store.pushPayload(response);
            }
          });

        }
      `;

      const { artifacts } = toArtifacts(
        entityFromSource('app/models/test-model.js', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );

      // Types are now merged into schema, so we have: schema (with types) + extension
      expect(artifacts).toHaveLength(2);

      const extension = artifacts.find((a) => a.type === 'resource-extension');
      const schema = artifacts.find((a) => a.type === 'schema');

      expect(extension).toMatchInlineSnapshot(`
        {
          "baseName": "test-model",
          "code": "import { memberAction } from 'test-app/decorators/api-actions';

        export class TestModelExtension {
          startProcess = memberAction({
                      path: 'start_process',
                      type: 'POST',
                      after(this: TestModel, response: TestModel): TestModel {
                        console.log('Process started');
                        return response;
                      }
                    })

          finishProcess = memberAction({
                      path: 'finish_process',
                      type: 'POST',
                      after(response: any): void {
                        this.store.pushPayload(response);
                      }
                    })
        }

        const Registration = {
          kind: 'object',
          name: 'test-model',
          features: TestModelExtension,
        };
        export default Registration;",
          "name": "TestModelExtension",
          "suggestedFileName": "test-model.ext.js",
          "type": "resource-extension",
        }
      `);
      expect(schema).toMatchInlineSnapshot(`
        {
          "baseName": "test-model",
          "code": "import { withDefaults } from '@ember-data/model/migration-support';

        import type { Type } from '@warp-drive/core-types/symbols';
        import type { WithLegacy } from '@ember-data/model/migration-support';

        const TestModelSchema = withDefaults({
          'type': 'test-model',
          'fields': [
            {
              'kind': 'attribute',
              'name': 'name',
              'type': 'string'
            }
          ]
        });

        export default TestModelSchema;

        /**
         * This type represents the full set schema derived fields of
         * the 'test-model' resource, without any of the legacy mode features
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
         * See also {@link TestModel} for fields + legacy mode features
         */
        export interface TestModelResource {
          readonly [Type]: 'test-model';
          id: string | null;
          name: string | null;
        }

        /**
         * This type represents the full set schema derived fields of
         * the 'test-model' resource, including all legacy mode features but
         * without any extensions.
         *
         * See also {@link TestModelResource} for just the fields
         */
        export interface TestModel extends WithLegacy<TestModelResource> {}
        ",
          "name": "TestModelSchema",
          "suggestedFileName": "test-model.schema.ts",
          "type": "schema",
        }
      `);
    });
  });

  describe('exported types in extensions', () => {
    it('preserves exported interfaces in extension files', () => {
      const input = `import Model, { attr } from '@ember-data/model';

export interface DisplayableChange {
  field: string;
  oldValue: string;
  newValue: string;
}

export type ChangeStatus = 'pending' | 'applied';

export const INTERNAL_HELPER = 'helper';

export default class Amendment extends Model {
  @attr('string') status;

  get changes(): DisplayableChange[] {
    return [];
  }
}`;

      const { artifacts } = toArtifacts(
        entityFromSource('app/models/amendment.ts', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );
      const extension = artifacts.find((a) => a.type === 'resource-extension');

      expect(extension?.code).toMatchInlineSnapshot(`
        "import type { Amendment } from './amendment.schema.ts';
        export interface DisplayableChange {
          field: string;
          oldValue: string;
          newValue: string;
        }

        export type ChangeStatus = 'pending' | 'applied';

        export const INTERNAL_HELPER = 'helper';

        // @ts-ignore-error in reality fields are not merged, they are overridden
        export interface AmendmentExtension extends Amendment {}
        export class AmendmentExtension {
          get changes(): DisplayableChange[] {
              return [];
            }
        }

        const Registration = {
          kind: 'object',
          name: 'amendment',
          features: AmendmentExtension,
        };
        export default Registration;"
      `);
    });

    it('preserves JSDoc comments on exported types', () => {
      const input = `import Model, { attr } from '@ember-data/model';

/**
 * Represents a displayable change to an amendment
 */
export interface DisplayableChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export default class Amendment extends Model {
  @attr('string') status;

  getChanges(): DisplayableChange[] {
    return [];
  }
}`;

      const { artifacts } = toArtifacts(
        entityFromSource('app/models/amendment.ts', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );
      const extension = artifacts.find((a) => a.type === 'resource-extension');

      expect(extension).toBeDefined();

      // Assert JSDoc is preserved
      expect(extension?.code).toContain('/**');
      expect(extension?.code).toContain('Represents a displayable change');
      expect(extension?.code).toContain('export interface DisplayableChange');
    });

    it('preserves multiple exported type definitions', () => {
      const input = `import Model, { attr } from '@ember-data/model';

export interface Config {
  enabled: boolean;
  threshold: number;
}

export type Status = 'active' | 'inactive' | 'pending';

export type Priority = 'low' | 'medium' | 'high';

export default class Task extends Model {
  @attr('string') name;

  get config(): Config {
    return { enabled: true, threshold: 100 };
  }
}`;

      const { artifacts } = toArtifacts(
        entityFromSource('app/models/task.ts', input, COMBINED_OPTIONS),
        COMBINED_OPTIONS
      );
      const extension = artifacts.find((a) => a.type === 'resource-extension');
      expect(extension?.code).toMatchInlineSnapshot(`
        "import type { Task } from './task.schema.ts';
        export interface Config {
          enabled: boolean;
          threshold: number;
        }

        export type Status = 'active' | 'inactive' | 'pending';

        export type Priority = 'low' | 'medium' | 'high';

        // @ts-ignore-error in reality fields are not merged, they are overridden
        export interface TaskExtension extends Task {}
        export class TaskExtension {
          get config(): Config {
              return { enabled: true, threshold: 100 };
            }
        }

        const Registration = {
          kind: 'object',
          name: 'task',
          features: TaskExtension,
        };
        export default Registration;"
      `);
    });
  });
});
