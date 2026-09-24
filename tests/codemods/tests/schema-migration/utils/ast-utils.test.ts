import { describe, expect, it } from 'vitest';

import type { TransformOptions } from '../../../../../packages/codemods/src/schema-migration/config.js';
import type {
  ArtifactConfig,
  ArtifactKind,
  SchemaArtifactRegistry,
} from '../../../../../packages/codemods/src/schema-migration/utils/artifact.js';
import { SchemaArtifact } from '../../../../../packages/codemods/src/schema-migration/utils/artifact.js';
import type { PropertyInfo } from '../../../../../packages/codemods/src/schema-migration/utils/ast-utils.js';
import {
  createExtensionArtifactWithTypes,
  createTypeArtifact,
  generateInterfaceCode,
  getTypeScriptTypeForAttribute,
  transformModelToResourceImport,
} from '../../../../../packages/codemods/src/schema-migration/utils/ast-utils.js';
import type { ParsedFile } from '../../../../../packages/codemods/src/schema-migration/utils/file-parser.js';

function createMockEntity(baseName: string, kind: ArtifactKind, path: string): SchemaArtifact {
  const parsed = {
    baseName,
    pascalName: baseName.replace(/(^|-)(\w)/g, (_m: string, _sep: string, c: string) => c.toUpperCase()),
    camelName: baseName.replace(/-(\w)/g, (_m: string, c: string) => c.toUpperCase()),
    path,
    name: baseName,
    extension: '.js' as const,
    imports: [],
    fields: [],
    behaviors: [],
    fileType: kind === 'mixin' ? ('mixin' as const) : ('model' as const),
    traits: [],
    hasExtension: false,
    source: '',
  } as ParsedFile;
  return SchemaArtifact.fromParsedFile(parsed, kind);
}

function buildTestRegistry(
  entries: Array<{ baseName: string; kind: ArtifactKind; path: string }>
): SchemaArtifactRegistry {
  const registry: SchemaArtifactRegistry = new Map();
  for (const entry of entries) {
    registry.set(entry.path, createMockEntity(entry.baseName, entry.kind, entry.path));
  }
  return registry;
}

const testOptions: TransformOptions = {
  warpDriveImports: 'legacy',
  projectImportsUseExtensions: true,
  projectName: 'test-app',
};

function makeTestConfig(
  name: string,
  fieldsInterface: string,
  traits: Array<{ name: string; fieldsInterface: string | null; extension: string | null }> = []
): ArtifactConfig {
  return {
    type: 'resource',
    name,
    hasTypes: true,
    schemaIsTyped: true,
    extensionIsTyped: false,
    hasExtension: false,
    identifiers: {
      schema: `${fieldsInterface}Schema`,
      fieldsInterface,
      type: fieldsInterface,
      extension: null,
      extensionAlias: null,
    },
    traits: traits.map((t) => ({
      name: t.name,
      identifiers: {
        fieldsInterface: t.fieldsInterface,
        extension: t.extension,
      },
    })),
  } as ArtifactConfig;
}

describe('AST utilities', () => {
  describe('getTypeScriptTypeForAttribute', () => {
    it('returns correct built-in types with proper nullability', () => {
      const result1 = getTypeScriptTypeForAttribute('string', false, true);
      expect(result1.tsType).toBe('string | null');

      const result2 = getTypeScriptTypeForAttribute('string', true, true);
      expect(result2.tsType).toBe('string');

      const result3 = getTypeScriptTypeForAttribute('number', false, false);
      expect(result3.tsType).toBe('number');
    });

    it('uses custom type mappings when provided', () => {
      const customMappings = {
        uuid: 'string',
        currency: 'number',
        json: 'Record<string, unknown>',
      };

      const options = { typeMapping: customMappings };

      const result1 = getTypeScriptTypeForAttribute('uuid', false, true, options);
      expect(result1.tsType).toBe('string | null');

      const result2 = getTypeScriptTypeForAttribute('currency', true, true, options);
      expect(result2.tsType).toBe('number');

      const result3 = getTypeScriptTypeForAttribute('json', false, false, options);
      expect(result3.tsType).toBe('Record<string, unknown>');
    });

    it('falls back to unknown for unsupported types', () => {
      const result1 = getTypeScriptTypeForAttribute('unsupported-type', false, true);
      expect(result1.tsType).toBe('unknown');

      const result2 = getTypeScriptTypeForAttribute('weird-transform', true, false);
      expect(result2.tsType).toBe('unknown');
    });

    it('prefers custom mappings over built-in types', () => {
      const customMappings = {
        string: 'CustomString',
        number: 'CustomNumber',
      };

      const options = { typeMapping: customMappings };

      const result1 = getTypeScriptTypeForAttribute('string', true, false, options);
      expect(result1.tsType).toBe('CustomString');

      const result2 = getTypeScriptTypeForAttribute('number', false, true, options);
      expect(result2.tsType).toBe('CustomNumber | null');
    });
  });

  describe('generateInterfaceCode', () => {
    it('generates basic interface with properties', () => {
      const properties = [
        { name: 'name', type: 'string', readonly: true, optional: false },
        { name: 'age', type: 'number', readonly: true, optional: true },
        { name: 'isActive', type: 'boolean', readonly: false, optional: false },
      ];

      const code = generateInterfaceCode(testOptions, makeTestConfig('test', 'TestInterface'), undefined, properties);
      expect(code).toMatchSnapshot('basic interface');
    });

    it('generates interface with extends clause', () => {
      const properties = [{ name: 'title', type: 'string', readonly: true, optional: false }];
      const config = makeTestConfig('test', 'TestInterface', [
        { name: 'base', fieldsInterface: 'BaseInterface', extension: null },
      ]);

      const code = generateInterfaceCode(testOptions, config, undefined, properties);
      expect(code).toMatchSnapshot('interface with extends');
    });

    it('generates interface with imports', () => {
      const properties = [{ name: 'user', type: 'User', readonly: true, optional: false }];

      const imports = ['import type User from "app/models/user";'];
      const code = generateInterfaceCode(
        testOptions,
        makeTestConfig('test', 'TestInterface'),
        undefined,
        properties,
        imports
      );
      expect(code).toMatchSnapshot('interface with imports');
    });

    it('generates interface with comments', () => {
      const properties = [
        { name: 'name', type: 'string', readonly: true, optional: false, comment: 'The user name' },
        { name: 'email', type: 'string', readonly: true, optional: true, comment: 'Optional email address' },
      ];

      const code = generateInterfaceCode(testOptions, makeTestConfig('test', 'TestInterface'), undefined, properties);
      expect(code).toMatchSnapshot('interface with comments');
    });

    it('generates empty interface when no properties', () => {
      const code = generateInterfaceCode(testOptions, makeTestConfig('empty', 'EmptyInterface'), undefined, []);
      expect(code).toMatchSnapshot('empty interface');
    });
  });

  describe('createTypeArtifact', () => {
    it('creates resource-type artifact with correct filename and type', () => {
      const properties = [{ name: 'name', type: 'string', readonly: true, optional: false }];
      const config = makeTestConfig('user', 'UserSchema');

      const artifact = createTypeArtifact(testOptions, config, undefined, properties, 'resource');

      expect(artifact.type).toBe('resource-type');
      expect(artifact.name).toBe('UserSchema');
      // Types are now merged into .schema files
      expect(artifact.suggestedFileName).toBe('user.schema.ts');
      expect(artifact.code).toMatchSnapshot('resource-type artifact code');
    });

    it('creates extension-type artifact with correct filename and type', () => {
      const properties = [{ name: 'displayName', type: 'unknown', readonly: false, optional: false }];
      const config = makeTestConfig('user', 'UserExtension');

      const artifact = createTypeArtifact(testOptions, config, undefined, properties, 'extension');

      expect(artifact.type).toBe('extension-type');
      expect(artifact.name).toBe('UserExtension');
      // Extensions now use .ext suffix
      expect(artifact.suggestedFileName).toBe('user.ext.ts');
      expect(artifact.code).toMatchSnapshot('extension-type artifact code');
    });

    it('creates trait-type artifact with correct filename and type', () => {
      const properties = [{ name: 'name', type: 'string', readonly: true, optional: false }];
      const config = makeTestConfig('fileable', 'FileableTrait');

      const artifact = createTypeArtifact(testOptions, config, undefined, properties, 'trait');

      expect(artifact.type).toBe('trait-type');
      expect(artifact.name).toBe('FileableTrait');
      // Types are now merged into .schema files
      expect(artifact.suggestedFileName).toBe('fileable.schema.ts');
      expect(artifact.code).toMatchSnapshot('trait-type artifact code');
    });

    it('creates legacy type artifact when no context provided', () => {
      const properties = [{ name: 'name', type: 'string', readonly: true, optional: false }];
      const config = makeTestConfig('test', 'TestInterface');

      const artifact = createTypeArtifact(testOptions, config, undefined, properties);

      expect(artifact.type).toBe('type');
      // Types are now merged into .schema files
      expect(artifact.suggestedFileName).toBe('test.schema.ts');
    });

    it('includes extends clause and imports when provided', () => {
      const properties = [{ name: 'name', type: 'string', readonly: true, optional: false }];
      const config = makeTestConfig('user', 'UserInterface', [
        { name: 'base', fieldsInterface: 'BaseInterface', extension: null },
      ]);

      const artifact = createTypeArtifact(testOptions, config, undefined, properties, 'resource', [
        'import type BaseInterface from "./base";',
      ]);

      expect(artifact.code).toMatchSnapshot('artifact with extends and imports');
    });
  });

  describe('createExtensionArtifactWithTypes', () => {
    it('creates extension artifact with corresponding type artifact', () => {
      const baseName = 'user';
      const extensionName = 'UserExtension';
      const properties: PropertyInfo[] = [
        {
          name: 'displayName',
          originalKey: 'displayName',
          value: 'computed("name", function() { return this.name; })',
          typeInfo: { type: 'function', optional: false, readonly: false },
        },
      ];

      const artifacts = createExtensionArtifactWithTypes(baseName, extensionName, properties, 'class');

      expect(artifacts.extensionArtifact).toBeDefined();
      // Type artifacts are no longer generated separately - types are merged into schema files
      expect(artifacts.typeArtifact).toBeNull();

      const extension = artifacts.extensionArtifact;

      expect(extension.name).toBe(extensionName);
      // Extension files now use .ext suffix
      expect(extension.suggestedFileName).toBe('user.ext.ts');
      // Extension artifact type is now 'resource-extension'
      expect(extension.type).toBe('resource-extension');
    });

    it('creates only extension artifact when no properties provided', () => {
      const baseName = 'user';
      const extensionName = 'UserExtension';
      const properties: PropertyInfo[] = [];

      const artifacts = createExtensionArtifactWithTypes(baseName, extensionName, properties, 'object');

      expect(artifacts.extensionArtifact).toBeNull();
      expect(artifacts.typeArtifact).toBeNull();
    });
  });

  describe('type mapping integration', () => {
    it('applies custom type mappings consistently across all functions', () => {
      const customTypeMappings = {
        uuid: 'string',
        currency: 'number',
        json: 'Record<string, unknown>',
      };

      const options = { typeMapping: customTypeMappings };

      // Test individual type resolution
      const result1 = getTypeScriptTypeForAttribute('uuid', false, true, options);
      expect(result1.tsType).toBe('string | null');

      const result2 = getTypeScriptTypeForAttribute('currency', true, false, options);
      expect(result2.tsType).toBe('number');

      const result3 = getTypeScriptTypeForAttribute('json', false, false, options);
      expect(result3.tsType).toBe('Record<string, unknown>');

      // Test interface generation with custom types
      const properties = [
        { name: 'id', type: 'string', readonly: true, optional: false },
        { name: 'amount', type: 'number', readonly: true, optional: false },
        { name: 'metadata', type: 'Record<string, unknown>', readonly: true, optional: true },
      ];

      const code = generateInterfaceCode(testOptions, makeTestConfig('test', 'TestInterface'), undefined, properties);
      expect(code).toMatchSnapshot('interface with custom type mappings');
      // Should map uuid to string, currency to number, json to Record<string, unknown>
    });
  });

  describe('transformModelToResourceImport', () => {
    it('generates trait imports for intermediate models', () => {
      const registry = buildTestRegistry([
        { baseName: 'data-field-model', kind: 'intermediate-model', path: '/path/to/data-field-model.ts' },
        { baseName: 'base-model', kind: 'intermediate-model', path: '/path/to/base-model.ts' },
      ]);
      const options = {
        intermediateModelPaths: ['soxhub-client/core/data-field-model', 'my-app/core/base-model'],
        traitsImport: 'my-app/data/traits',
        resourcesImport: 'my-app/data/resources',
        combineSchemasAndTypes: true,
      };

      // Test that data-field-model maps to data-field-model trait (baseName matches file name)
      const result1 = transformModelToResourceImport('data-field-model', 'User', options, registry);
      expect(result1).toBe(
        "type { DataFieldModelTrait as DataFieldModel } from 'my-app/data/traits/data-field-model.schema'"
      );

      // Test that base-model maps to base-model trait (baseName matches file name)
      const result2 = transformModelToResourceImport('base-model', 'User', options, registry);
      expect(result2).toBe("type { BaseModelTrait as BaseModel } from 'my-app/data/traits/base-model.schema'");

      // Test that regular models still go to resources (interface name comes from modelName param)
      const result3 = transformModelToResourceImport('user', 'Document', options, registry);
      expect(result3).toBe("type { Document } from 'my-app/data/resources/user.schema'");
    });

    it('generates trait imports for connected mixins', () => {
      const registry = buildTestRegistry([
        { baseName: 'workstreamable', kind: 'mixin', path: '/path/to/workstreamable.js' },
        { baseName: 'user', kind: 'model', path: '/path/to/user.js' },
      ]);
      // Link the mixin as a trait of the model
      const modelEntity = registry.get('/path/to/user.js')!;
      const mixinEntity = registry.get('/path/to/workstreamable.js')!;
      modelEntity.addTrait(mixinEntity);

      const options = {
        traitsImport: 'my-app/data/traits',
        resourcesImport: 'my-app/data/resources',
      };

      const result = transformModelToResourceImport('workstreamable', 'User', options, registry);
      expect(result).toBe(
        "type { WorkstreamableTrait as Workstreamable } from 'my-app/data/traits/workstreamable.type'"
      );
    });

    it('prioritizes resources, falls back to traits when no model exists', () => {
      const registry = buildTestRegistry([
        { baseName: 'user', kind: 'model', path: '/app/models/user.js' },
        { baseName: 'company', kind: 'model', path: '/app/models/company.js' },
        { baseName: 'shareable', kind: 'mixin', path: '/app/mixins/shareable.js' },
        { baseName: 'suggested', kind: 'mixin', path: '/app/mixins/suggested.js' },
      ]);
      const options = {
        traitsImport: 'my-app/data/traits',
        resourcesImport: 'my-app/data/resources',
        combineSchemasAndTypes: true,
      };

      // Test that existing model routes to resource import
      const result1 = transformModelToResourceImport('user', 'User', options, registry);
      expect(result1).toBe("type { User } from 'my-app/data/resources/user.schema'");

      // Test that mixin without model routes to trait import
      const result2 = transformModelToResourceImport('shareable', 'Shareable', options, registry);
      expect(result2).toBe("type { ShareableTrait as Shareable } from 'my-app/data/traits/shareable.schema'");

      // Test that suggested mixin routes to trait import
      const result3 = transformModelToResourceImport('suggested', 'Suggested', options, registry);
      expect(result3).toBe("type { SuggestedTrait as Suggested } from 'my-app/data/traits/suggested.schema'");

      // Test that non-existent type defaults to resource
      const result4 = transformModelToResourceImport('nonexistent', 'Nonexistent', options, registry);
      expect(result4).toBe("type { Nonexistent } from 'my-app/data/resources/nonexistent.schema'");
    });

    it('handles models with same name as mixins by prioritizing model', () => {
      const registry = buildTestRegistry([
        { baseName: 'user', kind: 'model', path: '/app/models/user.js' },
        { baseName: 'notification', kind: 'model', path: '/app/models/notification.js' },
        { baseName: 'shareable', kind: 'mixin', path: '/app/mixins/shareable.js' },
        { baseName: 'notification', kind: 'mixin', path: '/app/mixins/notification.js' }, // notification exists as both
      ]);
      const options = {
        traitsImport: 'my-app/data/traits',
        resourcesImport: 'my-app/data/resources',
        combineSchemasAndTypes: true,
      };

      // Test that when both model and mixin exist, model takes priority
      const result1 = transformModelToResourceImport('notification', 'Notification', options, registry);
      expect(result1).toBe("type { Notification } from 'my-app/data/resources/notification.schema'");

      // Test that mixin-only still works
      const result2 = transformModelToResourceImport('shareable', 'Shareable', options, registry);
      expect(result2).toBe("type { ShareableTrait as Shareable } from 'my-app/data/traits/shareable.schema'");
    });

    it('prefers extension imports when model has extension', () => {
      // Note: Types are now imported from .schema files regardless of extensions
      // Extensions (.ext files) contain runtime behavior, not types
      const options = {
        resourcesImport: 'my-app/data/resources',
        combineSchemasAndTypes: true,
      };

      // All types come from .schema files
      const result1 = transformModelToResourceImport('user', 'User', options, new Map());
      expect(result1).toBe("type { User } from 'my-app/data/resources/user.schema'");

      const result2 = transformModelToResourceImport('audit-survey', 'AuditSurvey', options, new Map());
      expect(result2).toBe("type { AuditSurvey } from 'my-app/data/resources/audit-survey.schema'");

      // Test that model without extension also uses .schema
      const result3 = transformModelToResourceImport('other-model', 'OtherModel', options, new Map());
      expect(result3).toBe("type { OtherModel } from 'my-app/data/resources/other-model.schema'");
    });

    it('prefers extension imports over resource imports when both available', () => {
      // Note: Types are now imported from .schema files regardless of extensions
      const registry = buildTestRegistry([
        { baseName: 'user', kind: 'model', path: '/app/models/user.js' },
        { baseName: 'company', kind: 'model', path: '/app/models/company.js' },
      ]);
      const options = {
        resourcesImport: 'my-app/data/resources',
        combineSchemasAndTypes: true,
      };

      // All types come from .schema files
      const result1 = transformModelToResourceImport('user', 'User', options, registry);
      expect(result1).toBe("type { User } from 'my-app/data/resources/user.schema'");

      // Company uses .schema as well
      const result2 = transformModelToResourceImport('company', 'Company', options, registry);
      expect(result2).toBe("type { Company } from 'my-app/data/resources/company.schema'");
    });

    it('handles empty entityRegistry', () => {
      const options = {
        resourcesImport: 'my-app/data/resources',
        combineSchemasAndTypes: true,
      };

      const result = transformModelToResourceImport('user', 'User', options, new Map());
      expect(result).toBe("type { User } from 'my-app/data/resources/user.schema'");
    });

    it('uses default resource path when resourcesImport not provided', () => {
      // Note: Types are now imported from .schema files
      const options = {
        resourcesImport: 'my-app/data/resources',
        combineSchemasAndTypes: true,
      };

      const result = transformModelToResourceImport('user', 'User', options, new Map());
      // All type imports come from .schema files
      expect(result).toBe("type { User } from 'my-app/data/resources/user.schema'");
    });

    it('prioritizes trait imports over extension imports for intermediate models', () => {
      const registry = buildTestRegistry([
        { baseName: 'base-model', kind: 'intermediate-model', path: '/path/to/base-model.ts' },
      ]);
      const options = {
        intermediateModelPaths: ['my-app/core/base-model'],
        modelsWithExtensions: new Set(['base-model']),
        traitsImport: 'my-app/data/traits',
        resourcesImport: 'my-app/data/resources',
      };

      // Intermediate models should always go to traits
      const result = transformModelToResourceImport('base-model', 'BaseModel', options, registry);
      expect(result).toBe("type { BaseModelTrait as BaseModel } from 'my-app/data/traits/base-model.type'");
    });
  });
});
