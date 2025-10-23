import { describe, expect, it } from 'vitest';

import transform, { toArtifacts } from '../../../../../packages/codemods/src/schema-migration/model-to-schema.js';
import { createTestOptions, DEFAULT_TEST_OPTIONS } from '../test-helpers.js';

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

      const artifacts = toArtifacts('app/models/user.js', input, DEFAULT_TEST_OPTIONS);
      expect(artifacts).toHaveLength(3);

      // Test artifact metadata
      expect(
        artifacts.map((a) => ({ type: a.type, suggestedFileName: a.suggestedFileName, name: a.name }))
      ).toMatchSnapshot('artifact metadata');

      // Test generated code separately for better readability
      const schema = artifacts.find((a) => a.type === 'schema');
      const extension = artifacts.find((a) => a.type === 'extension');
      expect(schema?.code).toMatchSnapshot('schema code');
      expect(extension?.code).toMatchSnapshot('extension code');
    });

    it('produces only schema artifact when model has no methods or computed properties', () => {
      const input = `import Model, { attr } from '@ember-data/model';

export default class SimpleModel extends Model {
	@attr('string') name;
	@attr('number') count;
}`;

      const artifacts = toArtifacts('app/models/simple-model.js', input, DEFAULT_TEST_OPTIONS);
      expect(artifacts).toHaveLength(2);
      expect(artifacts[0]?.type).toBe('schema');
      expect(artifacts[0]?.name).toBe('SimpleModelSchema');
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

      const artifacts = toArtifacts('app/models/document.js', input, DEFAULT_TEST_OPTIONS);
      expect(artifacts).toHaveLength(3);

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

      const artifacts = toArtifacts(
        'app/models/custom-model.js',
        input,
        createTestOptions({
          emberDataImportSource: '@auditboard/warp-drive/v1/model',
        })
      );
      expect(artifacts).toHaveLength(2);
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

      const artifacts = toArtifacts('app/models/complex-model.js', input, DEFAULT_TEST_OPTIONS);
      expect(artifacts).toHaveLength(2);
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

      const artifacts = toArtifacts('app/models/typed-model.ts', input, DEFAULT_TEST_OPTIONS);
      expect(artifacts).toHaveLength(3);

      const extension = artifacts.find((a) => a.type === 'extension');
      expect(extension?.code).toMatchSnapshot('typescript extension');
    });

    it('correctly extracts kebab-case file names to schema types', () => {
      const input = `import Model, { attr } from '@ember-data/model';

export default class ProjectPlan extends Model {
	@attr('string') title;
}`;

      const artifacts = toArtifacts('app/models/project-plan.js', input, DEFAULT_TEST_OPTIONS);
      expect(artifacts).toHaveLength(2);
      expect(artifacts[0]?.name).toBe('ProjectPlanSchema');
      expect(artifacts[0]?.suggestedFileName).toBe('project-plan.schema.js');
      // Verify the schema is valid by checking both structure and content
      expect(artifacts[0]?.code).toContain("'type': 'project-plan'");
      expect(artifacts[0]?.code).toContain('export const ProjectPlanSchema');
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

      const artifacts = toArtifacts('app/models/fragment-model.js', input, DEFAULT_TEST_OPTIONS);
      expect(artifacts).toHaveLength(2);
      expect(artifacts[0]?.name).toBe('FragmentModelSchema');
      expect(artifacts[0]?.suggestedFileName).toBe('fragment-model.schema.js');
      expect(artifacts[0]?.code).toContain("'type': 'fragment-model'");
      expect(artifacts[0]?.code).toContain('export const FragmentModelSchema');

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

      const artifacts = toArtifacts('app/models/address.js', input, DEFAULT_TEST_OPTIONS);
      expect(artifacts).toHaveLength(2);
      expect(artifacts[0]?.name).toBe('AddressSchema');
      expect(artifacts[0]?.suggestedFileName).toBe('address.schema.js');
      expect(artifacts[0]?.code).toContain('export const AddressSchema');

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

    it('handles classes extending intermediate fragment classes', () => {
      const input = `import Fragment from 'ember-data-model-fragments/fragment';
import BaseFragment from './base-fragment';
import { attr } from 'ember-data-model-fragments/fragment';

export default class Address extends BaseFragment {
  @attr('string') street;
  @attr('string') city;
}`;

      const artifacts = toArtifacts(
        'app/models/address.js',
        input,
        createTestOptions({
          intermediateFragmentPaths: ['./base-fragment', 'base-fragment'],
        })
      );

      expect(artifacts).toHaveLength(2);
      expect(artifacts[0]?.name).toBe('AddressSchema');

      // Should still be treated as a Fragment (with fragment schema structure)
      expect(artifacts[0]?.code).toContain("'type': 'fragment:address'");
      expect(artifacts[0]?.code).toContain("'identity': null");
      expect(artifacts[0]?.code).toContain("'objectExtensions'");
      expect(artifacts[0]?.code).toContain("'ember-object'");
      expect(artifacts[0]?.code).toContain("'fragment'");
    });

    it('handles fragmentArray correctly inside of models', () => {
      const input = `import Model, { attr } from '@ember-data/model';
import { fragmentArray } from 'ember-data-model-fragments/attributes';

export default class FragmentArrayModel extends Model {
	@attr('string') name;
  @fragmentArray('address') addresses;
}`;

      const artifacts = toArtifacts('app/models/fragment-array-model.js', input, DEFAULT_TEST_OPTIONS);
      expect(artifacts).toHaveLength(2);
      expect(artifacts[0]?.name).toBe('FragmentArrayModelSchema');
      expect(artifacts[0]?.suggestedFileName).toBe('fragment-array-model.schema.js');
      expect(artifacts[0]?.code).toContain("'type': 'fragment-array-model'");
      expect(artifacts[0]?.code).toContain('export const FragmentArrayModelSchema');

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

      const artifacts = toArtifacts('app/models/array-model.js', input, DEFAULT_TEST_OPTIONS);
      expect(artifacts).toHaveLength(2);
      expect(artifacts[0]?.name).toBe('ArrayModelSchema');
      expect(artifacts[0]?.suggestedFileName).toBe('array-model.schema.js');
      expect(artifacts[0]?.code).toContain("'type': 'array-model'");
      expect(artifacts[0]?.code).toContain('export const ArrayModelSchema');

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

      const artifacts = toArtifacts('app/components/not-a-model.js', input, DEFAULT_TEST_OPTIONS);
      expect(artifacts).toHaveLength(0);
    });

    it('skips files that do not extend Model', () => {
      const input = `import Model, { attr } from '@ember-data/model';
import EmberObject from '@ember/object';

export default class NotExtendingModel extends EmberObject {
	@attr('string') name;
}`;

      const artifacts = toArtifacts('app/models/not-extending-model.js', input, DEFAULT_TEST_OPTIONS);
      expect(artifacts).toHaveLength(0);
    });

    it('handles models with no fields gracefully', () => {
      const input = `import Model from '@ember-data/model';

export default class EmptyModel extends Model {
}`;

      const artifacts = toArtifacts('app/models/empty-model.js', input, DEFAULT_TEST_OPTIONS);
      // Empty models still generate a schema artifact (with just identity) and resource-type artifact
      expect(artifacts).toHaveLength(2);
      expect(artifacts[0]?.type).toBe('schema');
      expect(artifacts[0]?.code).toContain('export const EmptyModelSchema');
      expect(artifacts[1]?.type).toBe('resource-type');
    });

    it('handles aliased imports correctly', () => {
      const input = `import Model, { attr as attribute, hasMany as manyRelation } from '@ember-data/model';

export default class AliasedModel extends Model {
	@attribute('string') name;
	@manyRelation('item') items;
}`;

      const artifacts = toArtifacts('app/models/aliased-model.js', input, DEFAULT_TEST_OPTIONS);
      expect(artifacts).toHaveLength(2);
      expect(artifacts[0]?.code).toMatchSnapshot('aliased imports');
    });

    it('ignores decorators from unsupported sources', () => {
      const input = `import Model, { attr } from '@ember-data/model';
import { customDecorator } from '@unsupported/source';

export default class MixedSourceModel extends Model {
	@attr('string') name;
	@customDecorator items; // Should be ignored and moved to extension
}`;

      const artifacts = toArtifacts('app/models/mixed-source-model.js', input, DEFAULT_TEST_OPTIONS);
      expect(artifacts).toHaveLength(3);

      const schema = artifacts.find((a) => a.type === 'schema');
      const extension = artifacts.find((a) => a.type === 'extension');

      // Only 'name' should be in schema, not 'items'
      expect(schema?.code).toContain("'name': 'name'");
      expect(schema?.code).not.toContain('items');

      // Verify the schema is valid by checking structure
      expect(schema?.code).toContain('export const MixedSourceModelSchema');
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

      const artifacts = toArtifacts('app/models/auditboard-model.js', input, DEFAULT_TEST_OPTIONS);
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

      const artifacts = toArtifacts('app/models/complex-options-model.js', input, DEFAULT_TEST_OPTIONS);
      expect(artifacts).toHaveLength(2);
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

      const artifacts = toArtifacts('app/models/document.js', input, DEFAULT_TEST_OPTIONS);
      expect(artifacts).toHaveLength(2);

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

      const artifacts = toArtifacts('app/models/complex-document.js', input, DEFAULT_TEST_OPTIONS);
      expect(artifacts).toHaveLength(2);

      const schema = artifacts.find((a) => a.type === 'schema');
      expect(schema?.code).toMatchSnapshot('multiple mixins schema');
    });
  });

  describe('TypeScript type artifacts', () => {
    it('generates resource-type artifact with proper interface for basic models', () => {
      const input = `import Model, { attr, hasMany, belongsTo } from '@ember-data/model';

export default class User extends Model {
	@attr('string') name;
	@attr('boolean', { defaultValue: false }) isActive;
	@belongsTo('company', { async: false }) company;
	@hasMany('project', { async: true }) projects;
}`;

      const artifacts = toArtifacts('app/models/user.js', input, DEFAULT_TEST_OPTIONS);

      // Should have schema and resource-type artifacts (no extension for data-only models)
      expect(artifacts).toHaveLength(2);
      expect(artifacts.map((a) => a.type).sort()).toEqual(['resource-type', 'schema']);

      const schemaType = artifacts.find((a) => a.type === 'resource-type');
      expect(schemaType?.code).toMatchSnapshot('basic schema type interface');
      expect(schemaType?.suggestedFileName).toBe('user.schema.types.ts');
    });

    it('generates resource-type and extension artifacts when model has methods and computed properties', () => {
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

      const artifacts = toArtifacts('app/models/processed-model.js', input, DEFAULT_TEST_OPTIONS);

      // Should have schema, resource-type, and extension artifacts
      expect(artifacts).toHaveLength(3);
      expect(artifacts.map((a) => a.type).sort()).toEqual(['extension', 'resource-type', 'schema']);

      const schemaType = artifacts.find((a) => a.type === 'resource-type');
      const extension = artifacts.find((a) => a.type === 'extension');

      expect(schemaType?.code).toMatchSnapshot('model schema type interface');
      expect(extension?.code).toMatchSnapshot('model extension code');
      expect(schemaType?.suggestedFileName).toBe('processed-model.schema.types.ts');
      expect(extension?.suggestedFileName).toBe('processed-model.js');
    });

    it('handles custom type mappings in schema type interfaces', () => {
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

      const artifacts = toArtifacts(
        'app/models/typed-model.js',
        input,
        createTestOptions({ typeMapping: customTypeMappings })
      );
      const schemaType = artifacts.find((a) => a.type === 'resource-type');

      expect(schemaType?.code).toMatchSnapshot('custom type mappings interface');
    });

    it('handles relationship types correctly in schema type interfaces', () => {
      const input = `import Model, { attr, belongsTo, hasMany } from '@ember-data/model';

export default class RelationshipModel extends Model {
	@attr('string') name;
	@belongsTo('user', { async: false }) owner;
	@belongsTo('company', { async: true }) company;
	@hasMany('file', { async: false }) attachments;
	@hasMany('tag', { async: true }) tags;
}`;

      const artifacts = toArtifacts('app/models/relationship-model.js', input, DEFAULT_TEST_OPTIONS);
      const schemaType = artifacts.find((a) => a.type === 'resource-type');

      expect(schemaType?.code).toMatchSnapshot('relationship types interface');
    });

    it('uses unknown type for unsupported transforms', () => {
      const input = `import Model, { attr } from '@ember-data/model';

export default class UnknownTypesModel extends Model {
	@attr('custom-transform') customField;
	@attr('another-unknown') anotherField;
	@attr('string') knownField;
}`;

      const artifacts = toArtifacts('app/models/unknown-types-model.js', input, DEFAULT_TEST_OPTIONS);
      const schemaType = artifacts.find((a) => a.type === 'resource-type');

      expect(schemaType?.code).toMatchSnapshot('unknown types interface');
      expect(schemaType?.code).toContain('unknown');
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

      const artifacts = toArtifacts(
        'app/models/custom-types-model.js',
        input,
        createTestOptions({ typeMapping: customTypeMappings })
      );
      const schemaType = artifacts.find((a) => a.type === 'resource-type');

      expect(schemaType?.code).toMatchSnapshot('custom type mappings in schema types');
    });

    it('falls back to unknown for unmapped custom types', () => {
      const input = `import Model, { attr } from '@ember-data/model';

export default class UnmappedTypesModel extends Model {
	@attr('unknown-transform') field1;
	@attr('another-unknown') field2;
}`;

      const artifacts = toArtifacts('app/models/unmapped-types-model.js', input, DEFAULT_TEST_OPTIONS);
      const schemaType = artifacts.find((a) => a.type === 'resource-type');

      expect(schemaType?.code).toMatchSnapshot('unknown fallback for unmapped types');
      expect(schemaType?.code).toContain('unknown');
    });
  });

  describe('mirror flag', () => {
    it('uses @warp-drive-mirror imports when mirror flag is set', () => {
      const input = `import Model, { attr, belongsTo, hasMany } from '@ember-data/model';

export default class MirrorTestModel extends Model {
	@attr('string') name;
	@belongsTo('user', { async: true }) owner;
	@hasMany('tag', { async: false }) tags;
}`;

      const artifacts = toArtifacts('app/models/mirror-test-model.js', input, createTestOptions({ mirror: true }));
      const schemaType = artifacts.find((a) => a.type === 'resource-type');

      expect(schemaType?.code).toContain('@warp-drive-mirror/core/types/symbols');
      expect(schemaType?.code).toContain('@ember-data/model');
      expect(schemaType?.code).not.toContain('@warp-drive/core/types/symbols');
      expect(schemaType?.code).not.toContain('@warp-drive/legacy/model');
    });

    it('uses @warp-drive imports when mirror flag is not set', () => {
      const input = `import Model, { attr, belongsTo, hasMany } from '@ember-data/model';

export default class RegularTestModel extends Model {
	@attr('string') name;
	@belongsTo('user', { async: true }) owner;
	@hasMany('tag', { async: false }) tags;
}`;

      const artifacts = toArtifacts('app/models/regular-test-model.js', input, DEFAULT_TEST_OPTIONS);
      const schemaType = artifacts.find((a) => a.type === 'resource-type');

      expect(schemaType?.code).toContain('@warp-drive/core/types/symbols');
      expect(schemaType?.code).toContain('@ember-data/model');
      expect(schemaType?.code).not.toContain('@warp-drive-mirror/core/types/symbols');
      expect(schemaType?.code).not.toContain('@warp-drive-mirror/legacy/model');
    });

    it('uses configured emberDataImportSource for HasMany types in type artifacts', () => {
      const input = `import Model, { attr, hasMany, belongsTo } from '@auditboard/warp-drive/v1/model';

export default class RelationshipModel extends Model {
  @attr('string') name;
  @hasMany('tag', { async: false }) tags;
  @hasMany('project', { async: true }) projects;
  @belongsTo('user', { async: false }) owner;
}`;

      const artifacts = toArtifacts(
        'app/models/relationship-model.js',
        input,
        createTestOptions({
          emberDataImportSource: '@auditboard/warp-drive/v1/model',
        })
      );

      const schemaType = artifacts.find((a) => a.type === 'resource-type');

      expect(artifacts.length).toBeGreaterThan(0);
      expect(schemaType).toBeDefined();
      if (schemaType?.code) {
        expect(schemaType.code).toMatchSnapshot('custom EmberData source for HasMany types');
        expect(schemaType.code).toContain('@auditboard/warp-drive/v1/model');
        expect(schemaType.code).toContain('HasMany');
        expect(schemaType.code).toContain('AsyncHasMany');
        expect(schemaType.code).not.toContain('@ember-data/model');
      }
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

      const result = transform('app/models/test.ts', input, DEFAULT_TEST_OPTIONS);

      // Should transform relative imports to schema type imports
      expect(result).toContain("import type { AuditableEntity } from './auditable-entity.schema.types';");
      expect(result).toContain(
        "import type { AutomationWorkflowVersion } from './automation-workflow-version.schema.types';"
      );

      // Should preserve non-relative imports
      expect(result).toContain(
        "import type { ConnectedEntityType } from 'soxhub-client/components/module-automations/const/automation-workflow-instance';"
      );

      // Should not contain bad import paths with double extensions
      expect(result).not.toContain('.ts.schema.types');
      expect(result).not.toContain('.js.schema.types');
      expect(result).not.toContain("import type AuditableEntity from './auditable-entity';");
      expect(result).not.toContain("import type AutomationWorkflowVersion from './automation-workflow-version';");

      // Should convert the model to a schema - adjust expectation based on actual output
      expect(result).toContain('export const Test');
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

      const result = transform('app/models/test.ts', input, DEFAULT_TEST_OPTIONS);

      // Should only transform default type imports with relative paths
      expect(result).toContain("import type { SomeType } from './some-type.schema.types';");

      // Should not transform non-type imports
      expect(result).toContain("import { someFunction } from './some-utility';");
      expect(result).toContain("import RegularImport from './regular-import';");

      // Should not transform already-named type imports
      expect(result).toContain("import type { NamedType } from './named-type';");

      // Should not transform absolute imports
      expect(result).toContain("import type AbsoluteType from 'some-package/type';");

      // Should still generate the schema
      expect(result).toContain('export const Test'); // Accept either TestSchema or TestModelSchema
    });
  });

  describe('trait import aliasing', () => {
    it('generates aliased trait imports for backward compatibility', () => {
      const input = `import Model, { belongsTo } from '@ember-data/model';
import WorkstreamableMixin from '../mixins/workstreamable';

export default class TestModel extends Model.extend(WorkstreamableMixin) {
  @belongsTo('workstreamable', { async: false }) workstreamable;
}`;

      const artifacts = toArtifacts(
        'app/models/test-model.js',
        input,
        createTestOptions({
          // Mark workstreamable as a connected mixin so it imports from traits
          modelConnectedMixins: new Set(['/path/to/app/mixins/workstreamable.js']),
        })
      );

      const schemaType = artifacts.find((a) => a.type === 'resource-type');

      expect(artifacts.length).toBeGreaterThan(0);
      expect(schemaType).toBeDefined();
      if (schemaType?.code) {
        // Should import WorkstreamableTrait but alias it as Workstreamable for backward compatibility
        expect(schemaType.code).toContain('type { WorkstreamableTrait as Workstreamable }');
        expect(schemaType.code).toContain('../traits/workstreamable.schema.types');

        // Should use the aliased name in the interface
        expect(schemaType.code).toContain('readonly workstreamable: Workstreamable | null');
      }
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

      const artifacts = toArtifacts('app/models/user.js', input, DEFAULT_TEST_OPTIONS);
      const schema = artifacts.find((a) => a.type === 'schema');

      // Schema should not contain utility functions
      expect(schema?.code).not.toContain('function buildFullName');
      expect(schema?.code).not.toContain('export function formatDate');

      // Schema should only contain the schema export (no imports needed since no complex default values)
      expect(schema?.code).toContain('export const UserSchema');
      expect(schema?.code).not.toContain('get fullName');
      expect(schema?.code).not.toContain('import'); // No imports should be present
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

      const artifacts = toArtifacts('app/models/product.js', input, DEFAULT_TEST_OPTIONS);
      const extension = artifacts.find((a) => a.type === 'extension');

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

      const artifacts = toArtifacts('app/models/product.js', input, DEFAULT_TEST_OPTIONS);
      const extension = artifacts.find((a) => a.type === 'extension');

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
        directoryImportMapping: {
          'client-core/models': '@auditboard/client-core/models',
          'shared-lib/models': '@company/shared-lib/models',
        },
      });

      const artifacts = toArtifacts('client-core/models/translatable.js', input, optionsWithMapping);
      const extension = artifacts.find((a) => a.type === 'extension');

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
        directoryImportMapping: {
          'client-core/package/src': '@auditboard/client-core',
        },
      });

      const artifacts = toArtifacts('client-core/package/src/models/translatable.js', input, optionsWithMapping);
      const extension = artifacts.find((a) => a.type === 'extension');

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

      const artifacts = toArtifacts('app/models/test-model.js', input, DEFAULT_TEST_OPTIONS);

      // Should have schema, extension and resource-type artifacts
      expect(artifacts).toHaveLength(3);

      const extension = artifacts.find((a) => a.type === 'extension');
      expect(extension).toBeDefined();

      if (extension?.code) {
        // Should include the memberAction calls as properties
        expect(extension.code).toContain('startProcess = memberAction');
        expect(extension.code).toContain('finishProcess = memberAction');

        // Should NOT include standalone "after" methods
        // Count truly standalone after methods (not nested within memberAction calls)
        const lines = extension.code.split('\n');
        let standaloneAfterMethods = 0;
        let insideMemberAction = false;
        let memberActionBraceDepth = 0;

        for (const line of lines) {
          // Track if we're inside a memberAction call
          if (line.includes('memberAction(')) {
            insideMemberAction = true;
            memberActionBraceDepth = 0;
          }

          if (insideMemberAction) {
            // Count braces to track memberAction scope
            for (const char of line) {
              if (char === '{') memberActionBraceDepth++;
              if (char === '}') memberActionBraceDepth--;
            }

            // If braces are balanced, we've exited the memberAction
            if (memberActionBraceDepth === 0 && line.includes('}')) {
              insideMemberAction = false;
            }
          }

          // Count after methods only if they're NOT inside a memberAction
          if (/^\s*after\s*\(/g.test(line) && !insideMemberAction) {
            standaloneAfterMethods++;
          }
        }

        expect(standaloneAfterMethods).toBe(0);

        // But the after methods should still exist within the memberAction calls
        expect(extension.code).toContain('after(this: TestModel, response: TestModel)');
        expect(extension.code).toContain('after(response: any)');
      }
    });
  });
});
