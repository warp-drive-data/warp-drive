import type { SgNode } from '@ast-grep/napi';
import { Lang } from '@ast-grep/napi';
import { existsSync } from 'fs';
import { join } from 'path';

import type { TransformOptions } from '../config.js';
import type { ExtractedType, PropertyInfo, SchemaField, TransformArtifact } from '../utils/ast-utils.js';
import {
  buildTraitSchemaObject,
  collectTraitImports,
  createExtensionFromOriginalFile,
  debugLog,
  DEFAULT_EMBER_DATA_SOURCE,
  DEFAULT_MIXIN_SOURCE,
  extractCamelCaseName,
  extractTypeFromMethod,
  extractTypesFromInterface,
  findAssociatedInterface,
  findDefaultExport,
  findEmberImportLocalName,
  generateExportStatement,
  generateMergedSchemaCode,
  getEmberDataImports,
  getExportedIdentifier,
  getFieldKindFromDecorator,
  getFileExtension,
  getLanguageFromPath,
  mapFieldsToTypeProperties,
  toPascalCase,
  withTransformWrapper,
} from '../utils/ast-utils.js';
import {
  extractFieldNameFromKey,
  findObjectArgument,
  findStringArgument,
  isObjectMethodSyntax,
  NODE_KIND_AS_EXPRESSION,
  NODE_KIND_CALL_EXPRESSION,
  NODE_KIND_IDENTIFIER,
  NODE_KIND_LEXICAL_DECLARATION,
  NODE_KIND_MEMBER_EXPRESSION,
  NODE_KIND_METHOD_DEFINITION,
  NODE_KIND_OBJECT,
  NODE_KIND_PAIR,
  NODE_KIND_VARIABLE_DECLARATION,
  NODE_KIND_VARIABLE_DECLARATOR,
  parseObjectPropertiesFromNode,
} from '../utils/code-processing.js';
import type { ParsedFile } from '../utils/file-parser.js';
import { mixinNameToKebab, pascalToKebab } from '../utils/string.js';

/** Mixin.create() method name */
const MIXIN_METHOD_CREATE = 'create';

/** Mixin.createWithMixins() method name */
const MIXIN_METHOD_CREATE_WITH_MIXINS = 'createWithMixins';

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
    debugLog(options, `Resource type file does not exist: ${resourceTypeFilePath}, creating stub`);

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
 * Transform to convert Ember mixins to WarpDrive LegacyTrait patterns
 */
export default function transform(filePath: string, source: string, options: TransformOptions): string {
  return withTransformWrapper(
    filePath,
    source,
    options,
    'mixin-to-schema',
    (root, sourceContent, filePathParam, optionsParam) => {
      // Assume all files passed to this codemod are mixins that need to be converted to schemas
      return handleMixinTransform(root, sourceContent, filePathParam, optionsParam);
    }
  );
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
    debugLog(options, 'Not a mixin file, returning empty artifacts');
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
    debugLog(options, `Skipping ${mixinName}: not connected to any models`);
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

  debugLog(options, `Generated ${artifacts.length} artifacts`);
  return artifacts;
}

/**
 * Handle transformation of mixin files to LegacyTraits
 */
function handleMixinTransform(root: SgNode, source: string, filePath: string, options: TransformOptions): string {
  try {
    // Process all mixins - polymorphic mixins may not be "connected" but still need processing

    // Resolve local identifier used for the Mixin default import
    const mixinSources = [DEFAULT_MIXIN_SOURCE];
    const mixinImportLocal = findEmberImportLocalName(root, mixinSources, options, filePath, process.cwd());
    if (options?.debug) {
      debugLog(options, `Found mixin import local: ${mixinImportLocal}`);
    }
    if (!mixinImportLocal) {
      if (options?.debug) {
        debugLog(options, 'No ember/object/mixin import found; skipping transform');
      }
      // No ember/object/mixin import found; do not transform
      return source;
    }

    // Get the valid EmberData decorator imports for this file
    const emberDataSources = [options?.emberDataImportSource || DEFAULT_EMBER_DATA_SOURCE];
    const emberDataImports = getEmberDataImports(root, emberDataSources, options);
    if (options?.debug) {
      debugLog(options, 'Found EmberData imports:', emberDataImports);
    }

    // Extract the mixin name from the file path
    const mixinName = extractCamelCaseName(filePath);

    // Extract trait values (primarily attributes and relationships) and extension properties
    const { traitFields, extensionProperties, extendedTraits } = extractTraitFields(
      root,
      emberDataImports,
      mixinImportLocal,
      mixinName,
      filePath,
      options
    );
    if (options?.debug) {
      debugLog(
        options,
        `Found ${traitFields.length} trait fields, ${extensionProperties.length} extension properties, and ${extendedTraits.length} extended traits`
      );
    }
    if (traitFields.length === 0 && extensionProperties.length === 0) {
      if (options?.debug) {
        debugLog(options, 'No trait fields or extension properties found; skipping transform');
      }
      return source;
    }

    // Find default export using AST traversal
    const defaultExportNode = findDefaultExport(root, options);
    if (!defaultExportNode) {
      return source;
    }

    // Check if it's a direct Mixin.create() call
    if (isDirectMixinCreateExport(defaultExportNode, mixinImportLocal)) {
      const replacement = generateLegacyTrait(mixinName, traitFields, extensionProperties, extendedTraits);
      const original = defaultExportNode.text();
      return source.replace(original, replacement);
    }

    // Check if it's an identifier that references a Mixin.create() call
    const exportedIdentifier = getExportedIdentifier(defaultExportNode, options);
    if (
      exportedIdentifier &&
      isIdentifierInitializedByMixinCreate(root, exportedIdentifier, mixinImportLocal, options)
    ) {
      const replacement = generateLegacyTrait(mixinName, traitFields, extensionProperties, extendedTraits);
      const original = defaultExportNode.text();
      return source.replace(original, replacement);
    }

    // Nothing to replace
    return source;
  } catch {
    return source;
  }
}

/**
 * Check if a method name is a valid Mixin creation method
 */
function isMixinCreateMethod(methodName: string): boolean {
  return methodName === MIXIN_METHOD_CREATE || methodName === MIXIN_METHOD_CREATE_WITH_MIXINS;
}

/**
 * Check if a default export is directly calling Mixin.create() or Mixin.createWithMixins()
 */
function isDirectMixinCreateExport(exportNode: SgNode, mixinLocalName: string): boolean {
  // Look for a call expression in the export
  const callExpression = exportNode.find({ rule: { kind: NODE_KIND_CALL_EXPRESSION } });
  if (!callExpression) return false;

  // Check if the function being called is a member expression (e.g., Mixin.create or Mixin.createWithMixins)
  const memberExpression = callExpression.field('function');
  if (!memberExpression || memberExpression.kind() !== NODE_KIND_MEMBER_EXPRESSION) return false;

  // Check if the object is our mixin local name
  const object = memberExpression.field('object');
  if (!object || object.text() !== mixinLocalName) return false;

  // Check if the property is 'create' or 'createWithMixins'
  const property = memberExpression.field('property');
  if (!property) return false;

  return isMixinCreateMethod(property.text());
}

/**
 * Unwrap TypeScript type cast expressions (e.g., "as unknown as SomeType")
 */
function unwrapTypeCastExpressions(node: SgNode | null): SgNode | null {
  let current = node;
  while (current && current.kind() === NODE_KIND_AS_EXPRESSION) {
    const children = current.children();
    const expression = children[0];
    if (expression) {
      current = expression;
    } else {
      break;
    }
  }
  return current;
}

/**
 * Find all variable declarations in the AST (both var and const/let)
 */
function findAllVariableDeclarations(root: SgNode): SgNode[] {
  return [
    ...root.findAll({ rule: { kind: NODE_KIND_VARIABLE_DECLARATION } }),
    ...root.findAll({ rule: { kind: NODE_KIND_LEXICAL_DECLARATION } }),
  ];
}

/** Check whether an identifier is initialized by `<localMixin>.create(...)` */
function isIdentifierInitializedByMixinCreate(
  root: SgNode,
  ident: string,
  localMixin: string,
  options?: TransformOptions
): boolean {
  debugLog(options, `Checking if identifier '${ident}' is initialized by '${localMixin}.create()'`);

  const variableDeclarations = findAllVariableDeclarations(root);

  debugLog(options, `Found ${variableDeclarations.length} variable declarations`);

  for (const varDecl of variableDeclarations) {
    debugLog(options, `Variable declaration: ${varDecl.text()}`);

    // Get all declarators in this declaration
    const declarators = varDecl.findAll({ rule: { kind: NODE_KIND_VARIABLE_DECLARATOR } });

    for (const declarator of declarators) {
      // Check if the name matches our identifier
      const nameNode = declarator.field('name');
      if (!nameNode || nameNode.text() !== ident) continue;

      debugLog(options, `Found matching variable declarator for '${ident}'`);

      // Check if the value is a call expression (or wrapped in a type cast)
      const valueNode = unwrapTypeCastExpressions(declarator.field('value'));

      if (!valueNode || valueNode.kind() !== NODE_KIND_CALL_EXPRESSION) {
        debugLog(options, `Value is not a call expression: ${valueNode?.kind()}`);
        continue;
      }

      debugLog(options, `Found call expression: ${valueNode.text()}`);

      // Check if it's calling localMixin.create or localMixin.createWithMixins
      const functionNode = valueNode.field('function');
      if (!functionNode || functionNode.kind() !== NODE_KIND_MEMBER_EXPRESSION) {
        debugLog(options, `Function is not a member expression: ${functionNode?.kind()}`);
        continue;
      }

      const object = functionNode.field('object');
      const property = functionNode.field('property');

      if (!object || !property) {
        debugLog(options, 'Missing object or property in member expression');
        continue;
      }

      debugLog(options, `Member expression: ${object.text()}.${property.text()}`);

      if (object.text() === localMixin && isMixinCreateMethod(property.text())) {
        debugLog(options, `Found matching ${localMixin}.create() call!`);
        return true;
      }
    }
  }

  debugLog(options, 'No matching Mixin.create() initialization found');

  return false;
}

/**
 * Check if a call is a Mixin.create() or Mixin.createWithMixins() call
 */
function isMixinCreateCall(call: SgNode, mixinLocalName: string): boolean {
  const fn = call.field('function');
  if (!fn || fn.kind() !== NODE_KIND_MEMBER_EXPRESSION) return false;

  const object = fn.field('object');
  const property = fn.field('property');
  return object?.text() === mixinLocalName && isMixinCreateMethod(property?.text() ?? '');
}

/**
 * Find all Mixin.create() and Mixin.createWithMixins() calls in the AST
 */
function findMixinCreateCalls(root: SgNode, mixinLocalName: string): SgNode[] {
  return root
    .findAll({ rule: { kind: NODE_KIND_CALL_EXPRESSION } })
    .filter((call) => isMixinCreateCall(call, mixinLocalName));
}

/**
 * Extract extended traits from createWithMixins arguments
 */
function extractExtendedTraitsFromArgs(
  args: SgNode,
  extendedTraits: string[],
  mixinName: string,
  options?: TransformOptions
): void {
  const argNodes = args.children();
  if (argNodes.length <= 1) return;

  // Process all arguments except the last one (which is the object literal)
  for (let i = 0; i < argNodes.length - 1; i++) {
    const arg = argNodes[i];
    if (arg && arg.kind() === NODE_KIND_IDENTIFIER) {
      const extendedMixinName = arg.text();
      const traitName = mixinNameToKebab(extendedMixinName);
      if (!extendedTraits.includes(traitName)) {
        extendedTraits.push(traitName);
        debugLog(options, `Found extended trait: ${traitName} from mixin ${mixinName}`);
      }
    }
  }
}

/**
 * Get direct properties (pairs and method definitions) from an object literal
 */
function getObjectLiteralProperties(objectLiteral: SgNode): SgNode[] {
  return objectLiteral
    .children()
    .filter((child) => child.kind() === NODE_KIND_PAIR || child.kind() === NODE_KIND_METHOD_DEFINITION);
}

/**
 * Find object literals in arguments
 */
function findObjectLiteralsInArgs(args: SgNode): SgNode[] {
  return args.children().filter((child) => child.kind() === NODE_KIND_OBJECT);
}

/**
 * Process extended traits from all Mixin.create calls
 */
function processExtendedTraitsFromCalls(
  mixinCreateCalls: SgNode[],
  extendedTraits: string[],
  mixinName: string,
  options?: TransformOptions
): void {
  for (const call of mixinCreateCalls) {
    const fn = call.field('function');
    if (!fn || fn.kind() !== NODE_KIND_MEMBER_EXPRESSION) continue;

    const property = fn.field('property');
    if (property?.text() === MIXIN_METHOD_CREATE_WITH_MIXINS) {
      const args = call.field('arguments');
      if (args) {
        extractExtendedTraitsFromArgs(args, extendedTraits, mixinName, options);
      }
    }
  }
}

/**
 * Type information extracted from AST
 */
/**
 * Extract fields that can become trait fields (attr, hasMany, belongsTo)
 * and extension properties with TypeScript types
 */
export function extractTraitFields(
  root: SgNode,
  emberDataImports: Map<string, string>,
  mixinLocalName: string,
  mixinName: string,
  filePath: string,
  options?: TransformOptions
): {
  traitFields: Array<{ name: string; kind: string; type?: string; options?: Record<string, unknown> }>;
  extensionProperties: PropertyInfo[];
  extendedTraits: string[];
} {
  const traitFields: Array<{ name: string; kind: string; type?: string; options?: Record<string, unknown> }> = [];
  const extensionProperties: Array<{
    name: string;
    originalKey: string;
    value: string;
    typeInfo?: ExtractedType;
    isObjectMethod?: boolean;
  }> = [];
  const extendedTraits: string[] = [];

  // Look for associated interface in the same file
  const associatedInterface =
    getLanguageFromPath(filePath) === Lang.TypeScript ? findAssociatedInterface(root, mixinName, options) : null;
  let interfaceTypes = new Map<string, ExtractedType>();

  if (associatedInterface) {
    interfaceTypes = extractTypesFromInterface(associatedInterface, options);
    debugLog(options, `Found ${interfaceTypes.size} types from associated interface`);
  }

  // Find calls like <mixinLocalName>.create({ ... }) or .createWithMixins
  const mixinCreateCalls = findMixinCreateCalls(root, mixinLocalName);

  debugLog(options, `Found ${mixinCreateCalls.length} mixin create calls`);

  // Extract extended traits from createWithMixins calls
  processExtendedTraitsFromCalls(mixinCreateCalls, extendedTraits, mixinName, options);

  if (mixinCreateCalls.length === 0) {
    return { traitFields, extensionProperties, extendedTraits };
  }

  // Get the first argument (the object literal) of Mixin.create()
  const mixinCall = mixinCreateCalls[0];
  if (!mixinCall) {
    return { traitFields, extensionProperties, extendedTraits };
  }

  const args = mixinCall.field('arguments');
  if (!args) {
    debugLog(options, 'No arguments found in mixin create call');
    return { traitFields, extensionProperties, extendedTraits };
  }

  // Find the object literal argument - use the last one in case there are mixin references first
  const argChildren = args.children();
  const objectLiterals = findObjectLiteralsInArgs(args);
  const objectLiteral = objectLiterals[objectLiterals.length - 1]; // Get the last object literal
  if (!objectLiteral) {
    debugLog(options, 'No object literal found in mixin create arguments');
    return { traitFields, extensionProperties, extendedTraits };
  }

  // For regular create() calls with mixin references, extract extended traits from non-object arguments
  debugLog(
    options,
    `Processing Mixin.create arguments for ${mixinName}: ${argChildren.length} total args, ${objectLiterals.length} object literals`
  );
  if (objectLiterals.length > 0 && argChildren.length > 1) {
    for (let i = 0; i < argChildren.length; i++) {
      const arg = argChildren[i];
      debugLog(
        options,
        `  Arg ${i}: kind=${arg.kind()}, text='${arg.text()}', isObjectLiteral=${arg === objectLiteral}`
      );
      if (arg.kind() === NODE_KIND_IDENTIFIER && arg !== objectLiteral) {
        const extendedMixinName = arg.text();
        // Convert mixin name to dasherized trait name
        const traitName = mixinNameToKebab(extendedMixinName);
        if (!extendedTraits.includes(traitName)) {
          extendedTraits.push(traitName);
          debugLog(options, `Found extended trait: ${traitName} from mixin ${extendedMixinName}`);
        }
      }
    }
  }

  debugLog(options, `Found object literal with ${objectLiteral.children().length} children`);

  // Get direct properties of the object literal - both pairs and method definitions
  const directProperties = getObjectLiteralProperties(objectLiteral);

  debugLog(options, `Found ${directProperties.length} direct properties`);

  for (const property of directProperties) {
    let keyNode: SgNode | null;
    let valueNode: SgNode | null;
    let fieldName: string;
    let originalKey: string;
    let typeInfo: ExtractedType | undefined;

    if (property.kind() === NODE_KIND_METHOD_DEFINITION) {
      // Handle method definitions: complexMethod() { ... }
      keyNode = property.field('name');
      valueNode = property; // The entire method definition is the "value"
      fieldName = keyNode?.text() || '';
      originalKey = fieldName; // Method names are always unquoted

      // Try to get type from associated interface first
      if (interfaceTypes.has(fieldName)) {
        typeInfo = interfaceTypes.get(fieldName);
      } else {
        // Extract TypeScript type information from method
        try {
          typeInfo = extractTypeFromMethod(property, options) ?? undefined;
        } catch {
          // Ignore type extraction errors for methods in mixins
        }
      }
    } else {
      // Handle regular property pairs: key: value
      keyNode = property.field('key');
      valueNode = property.field('value');
      originalKey = keyNode?.text() || '';

      // Extract the actual property name (remove quotes if present)
      fieldName = extractFieldNameFromKey(originalKey);

      // Try to get type from associated interface
      if (interfaceTypes.has(fieldName)) {
        typeInfo = interfaceTypes.get(fieldName);
      }
    }

    if (!keyNode || !valueNode || !fieldName) continue;

    debugLog(options, `Processing property: ${fieldName}`);

    // Check if this is an EmberData trait field (only applies to regular pairs)
    if (property.kind() === NODE_KIND_PAIR && valueNode.kind() === NODE_KIND_CALL_EXPRESSION) {
      const functionNode = valueNode.field('function');
      if (functionNode) {
        const functionName = functionNode.text();
        debugLog(options, `Property ${fieldName} has function call: ${functionName}`);

        // Only process if this function is a properly imported EmberData decorator
        if (emberDataImports.has(functionName)) {
          const originalDecoratorName = emberDataImports.get(functionName);
          if (!originalDecoratorName) continue;

          debugLog(options, `Found EmberData decorator: ${functionName} -> ${originalDecoratorName}`);

          // Map EmberData field types to WarpDrive LegacyTrait field kinds
          const kind = getFieldKindFromDecorator(originalDecoratorName);

          // Extract type and options from the call expression
          const typeAndOptions = extractTypeAndOptionsFromCallExpression(valueNode, options);

          const field: { name: string; kind: string; type?: string; options?: Record<string, unknown> } = {
            name: fieldName,
            kind,
          };

          if (typeAndOptions) {
            field.type = typeAndOptions.type;
            if (Object.keys(typeAndOptions.options).length > 0) {
              field.options = typeAndOptions.options;
            }
          }

          traitFields.push(field);
          continue;
        }
      }
    }

    // If we reach here, it's not a trait field, so add it as an extension property
    // This includes computed properties, methods, service injections, etc.
    debugLog(options, `Adding ${fieldName} as extension property`);
    extensionProperties.push({
      name: fieldName,
      originalKey,
      value: valueNode.text(),
      typeInfo,
      isObjectMethod: isObjectMethodSyntax(property),
    });
  }

  debugLog(
    options,
    `Final results: ${traitFields.length} trait fields, ${extensionProperties.length} extension properties, ${extendedTraits.length} extended traits`
  );
  return { traitFields, extensionProperties, extendedTraits };
} /**
 * Extract mixin name from file path
 */

/**
 * Generate split output for mixed mixins - trait and extension parts
 */
// NOTE: previously we supported generating a split of trait + extension. The
// new behavior only replaces the mixin export and preserves the rest of the file.

/**
 * Generate LegacyTrait schema object
 */
function generateLegacyTrait(
  mixinName: string,
  traitFields: Array<{ name: string; kind: string; type?: string; options?: Record<string, unknown> }>,
  extensionProperties: PropertyInfo[],
  extendedTraits: string[] = []
): string {
  const traitName = `${mixinName}Trait`;
  // Convert to dasherized format for the name property
  const traitInternalName = pascalToKebab(mixinName);

  // If there are no trait fields, create an extension object instead
  if (traitFields.length === 0 && extensionProperties.length > 0) {
    const extensionName = `${mixinName}Extension`;

    // Build the object literal manually to avoid JSON.stringify escaping
    const properties = extensionProperties
      .map((prop) => {
        return `  ${prop.originalKey}: ${prop.value}`;
      })
      .join(',\n');

    return `export const ${extensionName} = {\n${properties}\n};`;
  }

  // Otherwise, create a standard LegacyTrait with fields
  const legacyTrait: Record<string, unknown> = {
    name: traitInternalName,
    mode: 'legacy' as const,
    fields: traitFields.map((field) => {
      const result: Record<string, unknown> = { name: field.name, kind: field.kind };
      if (field.type) {
        result.type = field.type;
      }
      if (field.options) {
        result.options = field.options;
      }
      return result;
    }),
  };

  // Add traits property if this trait extends other traits
  if (extendedTraits.length > 0) {
    legacyTrait.traits = extendedTraits;
  }

  // Return only the export block; do not modify imports or other code
  return generateExportStatement(traitName, legacyTrait);
}

/**
 * Extract type and options from a call expression like hasMany('file', { async: false, inverse: 'fileable' })
 */
function extractTypeAndOptionsFromCallExpression(
  callNode: SgNode,
  options?: TransformOptions
): { type: string; options: Record<string, unknown> } | null {
  debugLog(options, `Extracting options from call expression: ${callNode.text()}`);
  try {
    const args = callNode.field('arguments');
    if (!args) {
      debugLog(options, 'No arguments found in call expression');
      return null;
    }

    const argNodes = args.children();
    debugLog(options, `Found ${argNodes.length} arguments in call expression`);

    // Debug: show all arguments (only in debug mode)
    if (options?.debug) {
      for (let i = 0; i < argNodes.length; i++) {
        const argNode = argNodes[i];
        if (argNode) {
          debugLog(options, `Argument ${i}: kind=${argNode.kind()}, text="${argNode.text()}"`);
        }
      }
    }

    // Extract the type from the first argument (should be a string)
    const type = findStringArgument(argNodes);

    if (!type) {
      debugLog(options, 'No string type argument found in call expression');
      return null;
    }

    // Find the actual object argument (skip whitespace and other non-content nodes)
    const optionsNode = findObjectArgument(argNodes);

    if (!optionsNode) {
      debugLog(options, 'No object argument found in call expression');
      return { type, options: {} };
    }
    debugLog(options, `Second argument kind: ${optionsNode.kind()}`);

    // Parse the object literal to extract key-value pairs
    const optionsObj = parseObjectPropertiesFromNode(optionsNode);

    debugLog(options, `Extracted type: ${type}, options: ${JSON.stringify(optionsObj)}`);
    return { type, options: optionsObj };
  } catch (error) {
    debugLog(options, `Error extracting options: ${String(error)}`);
    return null;
  }
}
