import { existsSync } from 'fs';
import { join } from 'path';

import { logger } from '../../../utils/logger.js';
import type { TransformOptions } from '../config.js';
import type { PropertyInfo, SchemaField, TransformArtifact } from '../utils/ast-utils.js';
import {
  buildTraitSchemaObject,
  collectTraitImports,
  createExtensionFromOriginalFile,
  DEFAULT_EMBER_DATA_SOURCE,
  generateMergedSchemaCode,
  getFileExtension,
  mapFieldsToTypeProperties,
  toPascalCase,
} from '../utils/ast-utils.js';
import type { ParsedFile } from '../utils/file-parser.js';
import { pascalToKebab } from '../utils/string.js';

const log = logger.for('mixin-processor');

/**
 * Check if a resource type file exists and create a stub if it doesn't
 */
function ensureResourceTypeFileExists(
  modelType: string,
  options: TransformOptions,
  artifacts: TransformArtifact[]
): boolean {
  const pascalCaseType = toPascalCase(modelType);

  // Use resourcesDir if available, otherwise fall back to current directory
  const baseDir = options.resourcesDir || '.';
  const resourceTypeFilePath = join(baseDir, `${modelType}.schema.ts`);

  // Check if the file exists
  if (!existsSync(resourceTypeFilePath)) {
    log.debug(`Resource type file does not exist: ${resourceTypeFilePath}, creating stub`);

    // Create a stub interface
    const stubCode = generateStubResourceTypeInterface(pascalCaseType);

    // Add the stub as an artifact
    artifacts.push({
      type: 'resource-type-stub',
      name: pascalCaseType,
      code: stubCode,
      suggestedFileName: `${modelType}.schema.ts`,
    });

    return true; // Stub was created
  }

  return false; // File exists, no stub needed
}

/**
 * Generate a stub resource type interface
 */
function generateStubResourceTypeInterface(typeName: string): string {
  return `// Stub interface for ${typeName} - generated automatically
// This file will be replaced when the actual resource type is generated

export interface ${typeName} {
  // Stub: properties will be populated when the actual resource type is generated
}
`;
}

/**
 * Produce zero, one, or two artifacts for a given mixin file:
 * - Trait artifact when attr/hasMany/belongsTo fields are present
 * - Extension artifact when non-trait properties (methods, computeds) are present
 *
 * This does not modify the original source. The CLI can use this to write
 * files to the requested output directories.
 */
export function toArtifacts(parsedFile: ParsedFile, options: TransformOptions): TransformArtifact[] {
  const { path: filePath, source, baseName, camelName: mixinName } = parsedFile;

  if (parsedFile.fileType !== 'mixin') {
    log.debug('Not a mixin file, returning empty artifacts');
    return [];
  }

  const traitFields = parsedFile.fields.map((f) => ({
    name: f.name,
    kind: f.kind,
    type: f.type,
    options: f.options,
  }));

  const extensionProperties: PropertyInfo[] = parsedFile.behaviors.map((b) => ({
    name: b.name,
    originalKey: b.originalKey,
    value: b.value,
    typeInfo: b.typeInfo,
    isObjectMethod: b.isObjectMethod,
  }));

  const extendedTraits = [...parsedFile.traits];

  // Check if this mixin is connected to models (directly or transitively)
  // In test environment, treat all mixins as connected unless explicitly specified
  const isConnectedToModel =
    options?.modelConnectedMixins?.has(filePath) ?? (process.env.NODE_ENV === 'test' || options?.testMode === true);

  if (!isConnectedToModel) {
    log.debug(`Skipping ${mixinName}: not connected to any models`);
    return [];
  }

  return generateMixinArtifacts(
    filePath,
    source,
    baseName,
    mixinName,
    traitFields,
    extensionProperties,
    extendedTraits,
    options
  );
}

/**
 * Shared artifact generation logic
 */
function generateMixinArtifacts(
  filePath: string,
  source: string,
  baseName: string,
  mixinName: string,
  traitFields: Array<{ name: string; kind: string; type?: string; options?: Record<string, unknown> }>,
  extensionProperties: PropertyInfo[],
  extendedTraits: string[],
  options: TransformOptions
): TransformArtifact[] {
  const artifacts: TransformArtifact[] = [];
  const fileExtension = getFileExtension(filePath);
  const isTypeScript = fileExtension === '.ts';

  const traitInterfaceName = `${mixinName.charAt(0).toUpperCase() + mixinName.slice(1)}Trait`;

  const traitFieldTypes = mapFieldsToTypeProperties(traitFields as SchemaField[], options, false);

  const imports = new Set<string>();
  const modelTypes = new Set<string>();

  for (const field of traitFields) {
    if (field.kind === 'belongsTo' || field.kind === 'hasMany') {
      if (field.type) {
        modelTypes.add(field.type);
      }

      if (field.kind === 'hasMany') {
        const emberDataSource = options?.emberDataImportSource || DEFAULT_EMBER_DATA_SOURCE;
        if (field.options?.async) {
          imports.add(`type { AsyncHasMany } from '${emberDataSource}'`);
        } else {
          imports.add(`type { HasMany } from '${emberDataSource}'`);
        }
      }
    }
  }

  if (modelTypes.size > 0) {
    for (const modelType of modelTypes) {
      const pascalCaseType = toPascalCase(modelType);

      if (options.resourcesDir) {
        ensureResourceTypeFileExists(modelType, options, artifacts);
      }

      imports.add(`type { ${pascalCaseType} } from '${options.resourcesImport}/${modelType}.schema'`);
    }
  }

  collectTraitImports(extendedTraits, imports, options);

  const traitSchemaName = traitInterfaceName;
  const traitInternalName = pascalToKebab(mixinName);
  const traitSchemaObject = buildTraitSchemaObject(traitFields as SchemaField[], extendedTraits, {
    name: traitInternalName,
    mode: 'legacy',
  });

  const mergedTraitSchemaCode = generateMergedSchemaCode({
    baseName,
    interfaceName: traitInterfaceName,
    schemaName: traitSchemaName,
    schemaObject: traitSchemaObject,
    properties: traitFieldTypes,
    traits: extendedTraits,
    imports,
    isTypeScript,
  });

  artifacts.push({
    type: 'trait',
    name: traitSchemaName,
    code: mergedTraitSchemaCode,
    suggestedFileName: `${baseName}.schema${fileExtension}`,
  });

  if (extensionProperties.length > 0) {
    const traitImportPath = options?.traitsImport
      ? `${options.traitsImport}/${baseName}.schema`
      : `../traits/${baseName}.schema`;
    const extensionArtifact = createExtensionFromOriginalFile(
      filePath,
      source,
      baseName,
      `${mixinName}Extension`,
      extensionProperties,
      options,
      traitInterfaceName,
      traitImportPath,
      'mixin',
      undefined,
      'trait'
    );

    if (extensionArtifact) {
      artifacts.push(extensionArtifact);
    }
  }

  log.debug(`Generated ${artifacts.length} artifacts`);
  return artifacts;
}
