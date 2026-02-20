/**
 * File Parser Module
 *
 * Provides intermediate parsed file structures to avoid repetitive AST parsing
 * across different processing stages. Files are parsed once after discovery
 * and the parsed data is reused throughout the migration process.
 */

import { parse, type SgNode } from '@ast-grep/napi';

import type { TransformOptions } from '../config.js';
import {
  findDefaultExport,
  getEmberDataImports,
  getMixinImports,
  parseDecoratorArgumentsWithNodes,
} from './ast-helpers.js';
import {
  NODE_KIND_ARROW_FUNCTION,
  NODE_KIND_CALL_EXPRESSION,
  NODE_KIND_CLASS_BODY,
  NODE_KIND_CLASS_DECLARATION,
  NODE_KIND_CLASS_HERITAGE,
  NODE_KIND_DECORATOR,
  NODE_KIND_FIELD_DEFINITION,
  NODE_KIND_FUNCTION,
  NODE_KIND_IDENTIFIER,
  NODE_KIND_IMPORT_CLAUSE,
  NODE_KIND_IMPORT_STATEMENT,
  NODE_KIND_MEMBER_EXPRESSION,
  NODE_KIND_METHOD_DEFINITION,
  NODE_KIND_PAIR,
  NODE_KIND_PROPERTY_IDENTIFIER,
} from './code-processing.js';
import { DEFAULT_EMBER_DATA_SOURCE, findEmberImportLocalName } from './import-utils.js';
import { debugLog } from './logging.js';
import { extractBaseName, extractCamelCaseName, extractPascalCaseName, getLanguageFromPath } from './path-utils.js';
import { convertToSchemaField } from './schema-generation.js';
import { mixinNameToKebab, removeQuoteChars } from './string.js';
import type { ExtractedType } from './type-utils.js';
import { extractTypeFromDeclaration, extractTypeFromDecorator, extractTypeFromMethod } from './type-utils.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Represents an import statement in a parsed file
 */
export interface ParsedFileImport {
  /** The import path as written in the source */
  path: string;
  /** Classification of the import */
  type: 'library' | 'mixin' | 'model' | 'ember-data' | 'other';
  /** Local name(s) imported */
  localNames: string[];
  /** Whether it's a default import */
  isDefault: boolean;
  /** Whether this is a type-only import (import type ...) */
  isTypeOnly: boolean;
}

/**
 * Represents an EmberData schema field (@attr, @hasMany, @belongsTo, etc.)
 */
export interface ParsedField {
  /** Field name as declared */
  name: string;
  /** Field kind: attribute, belongsTo, hasMany, schema-object, schema-array, array */
  kind: 'attribute' | 'belongsTo' | 'hasMany' | 'schema-object' | 'schema-array' | 'array';
  /** Type argument (e.g., 'string', 'user', 'boolean') */
  type?: string;
  /** Options passed to the decorator */
  options?: Record<string, unknown>;
  /** TypeScript type annotation if present */
  tsType?: string;
}

/**
 * Represents behavior (methods, computed properties, etc.) that becomes extension code
 */
export interface ParsedBehavior {
  /** Property/method name */
  name: string;
  /** Original key (may include quotes for computed properties) */
  originalKey: string;
  /** The full source text of the property/method */
  value: string;
  /** TypeScript type information */
  typeInfo?: ExtractedType;
  /** Whether this uses object method syntax */
  isObjectMethod: boolean;
  /** Kind of behavior */
  kind: 'method' | 'computed' | 'getter' | 'setter' | 'property';
}

/**
 * Intermediate parsed file structure containing all extracted information
 * from a model or mixin file. This structure is created once after file
 * discovery and reused throughout the migration process.
 */
export interface ParsedFile {
  /** File name without extension (e.g., 'user' from 'user.ts') */
  name: string;
  /** Absolute file path */
  path: string;
  /** Original file extension (.ts or .js) */
  extension: '.ts' | '.js';
  /** All imports in the file */
  imports: ParsedFileImport[];
  /** EmberData schema fields (@attr, @hasMany, @belongsTo, fragment, etc.) */
  fields: ParsedField[];
  /** Behavior - methods, computed properties, getters/setters, other properties */
  behaviors: ParsedBehavior[];
  /** File type classification */
  fileType: 'model' | 'mixin' | 'fragment' | 'unknown';
  /** Extended traits (for models using .extend() or mixins using createWithMixins) */
  traits: string[];
  /** Whether this file has behavior that requires an extension artifact */
  hasExtension: boolean;
  /** For models: the base class being extended */
  baseClass?: string;
  /** PascalCase name derived from file path */
  pascalName: string;
  /** camelCase name derived from file path */
  camelName: string;
  /** kebab-case name (base name) */
  baseName: string;
  /** Original source code - preserved for functions that still need raw access during transition */
  source: string;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_MIXIN_SOURCE = '@ember/object/mixin';
const FRAGMENT_BASE_SOURCE = 'ember-data-model-fragments/fragment';
const WARP_DRIVE_MODEL = '@warp-drive/model';

const FIELD_DEFINITION_NODE_TYPES = [
  NODE_KIND_FIELD_DEFINITION,
  'public_field_definition',
  'class_field',
  'property_signature',
];

// ============================================================================
// Import Classification
// ============================================================================

function classifyImport(importPath: string, options: TransformOptions): ParsedFileImport['type'] {
  const emberDataSources = [
    options.emberDataImportSource || DEFAULT_EMBER_DATA_SOURCE,
    'ember-data-model-fragments/attributes',
    FRAGMENT_BASE_SOURCE,
    WARP_DRIVE_MODEL,
  ];

  if (emberDataSources.some((src) => importPath.startsWith(src))) {
    return 'ember-data';
  }

  if (importPath === DEFAULT_MIXIN_SOURCE || importPath.includes('/mixin')) {
    return 'mixin';
  }

  if (options.mixinImportSource && importPath.startsWith(options.mixinImportSource)) {
    return 'mixin';
  }

  if (options.modelImportSource && importPath.startsWith(options.modelImportSource)) {
    return 'model';
  }

  if (importPath.includes('/models/')) {
    return 'model';
  }

  if (importPath.includes('/mixins/')) {
    return 'mixin';
  }

  if (importPath.startsWith('@') || !importPath.startsWith('.')) {
    return 'library';
  }

  return 'other';
}

function parseImports(root: SgNode, options: TransformOptions): ParsedFileImport[] {
  const parsedImports: ParsedFileImport[] = [];
  const importStatements = root.findAll({ rule: { kind: NODE_KIND_IMPORT_STATEMENT } });

  for (const importNode of importStatements) {
    const source = importNode.field('source');
    if (!source) continue;

    const importPath = removeQuoteChars(source.text());
    const localNames: string[] = [];
    let isDefault = false;

    // Detect type-only imports: "import type ..." or "import type {...}"
    const importText = importNode.text();
    const isTypeOnly = /^import\s+type\s/.test(importText);

    const importClause = importNode.children().find((child) => child.kind() === NODE_KIND_IMPORT_CLAUSE);
    if (importClause) {
      const identifiers = importClause.findAll({ rule: { kind: NODE_KIND_IDENTIFIER } });
      for (const ident of identifiers) {
        const name = ident.text();
        if (name && name !== 'type') {
          localNames.push(name);
        }
      }

      // Check if there's a default import (first identifier before any braces)
      const clauseText = importClause.text();
      if (!clauseText.startsWith('{') && !clauseText.startsWith('* as')) {
        isDefault = true;
      }
    }

    parsedImports.push({
      path: importPath,
      type: classifyImport(importPath, options),
      localNames,
      isDefault,
      isTypeOnly,
    });
  }

  return parsedImports;
}

// ============================================================================
// Field & Behavior Extraction (Model)
// ============================================================================

function findClassDeclarationInRoot(root: SgNode, options?: TransformOptions): SgNode | null {
  const defaultExport = findDefaultExport(root, options);
  if (!defaultExport) {
    return root.find({ rule: { kind: NODE_KIND_CLASS_DECLARATION } });
  }

  // Try to find class declaration in the export
  let classDeclaration = defaultExport.find({ rule: { kind: NODE_KIND_CLASS_DECLARATION } });
  if (classDeclaration) {
    return classDeclaration;
  }

  // Check if export references a class by identifier
  const identifiers = defaultExport.children().filter((child) => child.kind() === NODE_KIND_IDENTIFIER);
  for (const identifier of identifiers) {
    const name = identifier.text();
    if (name !== 'default' && name !== 'export') {
      classDeclaration = root.find({
        rule: {
          kind: NODE_KIND_CLASS_DECLARATION,
          has: {
            kind: NODE_KIND_IDENTIFIER,
            regex: `^${name}$`,
          },
        },
      });
      if (classDeclaration) {
        return classDeclaration;
      }
    }
  }

  return null;
}

export function isClassMethodSyntax(methodNode: SgNode): boolean {
  const methodKind = methodNode.kind();

  if (methodKind === NODE_KIND_METHOD_DEFINITION) {
    return true;
  }

  if (methodKind === NODE_KIND_FIELD_DEFINITION) {
    const value = methodNode.field('value');
    if (value) {
      const valueKind = value.kind();
      if (valueKind === NODE_KIND_ARROW_FUNCTION || valueKind === NODE_KIND_FUNCTION) {
        return false;
      }
    }
  }

  return false;
}

function findPropertyDefinitions(classBody: SgNode, options?: TransformOptions): SgNode[] {
  for (const nodeType of FIELD_DEFINITION_NODE_TYPES) {
    try {
      const properties = classBody.findAll({ rule: { kind: nodeType } });
      if (properties.length > 0) {
        debugLog(options, `Found ${properties.length} properties using ${nodeType}`);
        return properties;
      }
    } catch {
      // Continue to next node type
    }
  }
  return [];
}

function findMethodDefinitions(classBody: SgNode): SgNode[] {
  return classBody.children().filter((child) => child.kind() === NODE_KIND_METHOD_DEFINITION);
}

function determineBehaviorKind(node: SgNode): ParsedBehavior['kind'] {
  const nodeKind = node.kind();

  if (nodeKind === NODE_KIND_METHOD_DEFINITION) {
    const prevSibling = node.prev();

    if (prevSibling?.text() === 'get') {
      return 'getter';
    }
    if (prevSibling?.text() === 'set') {
      return 'setter';
    }

    return 'method';
  }

  if (nodeKind === NODE_KIND_FIELD_DEFINITION) {
    const value = node.field('value');
    if (value) {
      const valueKind = value.kind();
      if (valueKind === NODE_KIND_CALL_EXPRESSION) {
        const fn = value.field('function');
        if (fn?.kind() === NODE_KIND_MEMBER_EXPRESSION) {
          const prop = fn.field('property');
          if (prop?.text() === 'computed' || prop?.text() === 'alias' || prop?.text() === 'reads') {
            return 'computed';
          }
        }
        if (fn?.text() === 'computed') {
          return 'computed';
        }
      }
      if (valueKind === NODE_KIND_ARROW_FUNCTION || valueKind === NODE_KIND_FUNCTION) {
        return 'method';
      }
    }
    return 'property';
  }

  return 'property';
}

interface ExtractedModelData {
  fields: ParsedField[];
  behaviors: ParsedBehavior[];
  traits: string[];
  baseClass?: string;
}

function extractModelData(root: SgNode, filePath: string, options: TransformOptions): ExtractedModelData {
  const fields: ParsedField[] = [];
  const behaviors: ParsedBehavior[] = [];
  const traits: string[] = [];
  let baseClass: string | undefined;

  const isJavaScript = filePath.endsWith('.js');

  const classDeclaration = findClassDeclarationInRoot(root, options);
  if (!classDeclaration) {
    return { fields, behaviors, traits, baseClass };
  }

  // Extract base class and traits from heritage clause
  const heritageClause = classDeclaration.find({ rule: { kind: NODE_KIND_CLASS_HERITAGE } });
  if (heritageClause) {
    const mixinImports = getMixinImports(root, options);

    // Find base class (first identifier before .extend())
    const heritageText = heritageClause.text();
    const extendMatch = heritageText.match(/^(\w+)(?:\.extend)?/);
    if (extendMatch) {
      baseClass = extendMatch[1];
    }

    // Extract mixin traits from .extend() arguments
    for (const [localName, importPath] of mixinImports) {
      if (heritageText.includes(localName)) {
        const traitName =
          importPath
            .split('/')
            .pop()
            ?.replace(/\.(?:js|ts)$/, '') || localName;
        traits.push(traitName);
      }
    }
  }

  // Get EmberData imports to identify decorators
  const emberDataSources = [
    options.emberDataImportSource || DEFAULT_EMBER_DATA_SOURCE,
    'ember-data-model-fragments/attributes',
    FRAGMENT_BASE_SOURCE,
    WARP_DRIVE_MODEL,
  ];
  const emberDataImports = getEmberDataImports(root, emberDataSources, options);

  // Get class body
  const classBody = classDeclaration.find({ rule: { kind: NODE_KIND_CLASS_BODY } });
  if (!classBody) {
    return { fields, behaviors, traits, baseClass };
  }

  // Find property and method definitions
  const propertyDefinitions = findPropertyDefinitions(classBody, options);
  const methodDefinitions = findMethodDefinitions(classBody);

  // Process property definitions
  for (const property of propertyDefinitions) {
    const nameNodes = property.findAll({ rule: { kind: NODE_KIND_PROPERTY_IDENTIFIER } });
    const nameNode = nameNodes[nameNodes.length - 1];
    if (!nameNode) continue;

    const fieldName = nameNode.text();
    const originalKey = fieldName;

    // Extract TypeScript type
    let typeInfo: ExtractedType | undefined;
    if (!isJavaScript) {
      try {
        typeInfo = extractTypeFromDeclaration(property, options) ?? undefined;
      } catch {
        // Ignore type extraction errors
      }
    }

    // Check for EmberData decorators
    const decorators = property.findAll({ rule: { kind: NODE_KIND_DECORATOR } });
    let isSchemaField = false;

    for (const decorator of decorators) {
      const decoratorText = decorator.text().replace('@', '');
      const decoratorName = decoratorText.split('(')[0].split('<')[0];

      if (!decoratorName) continue;

      if (emberDataImports.has(decoratorName)) {
        const originalDecoratorName = emberDataImports.get(decoratorName);
        if (!originalDecoratorName) continue;

        const decoratorArgs = parseDecoratorArgumentsWithNodes(decorator);

        if (!typeInfo) {
          try {
            typeInfo = extractTypeFromDecorator(originalDecoratorName, decoratorArgs, options) ?? undefined;
          } catch {
            // Ignore type extraction errors
          }
        }

        const schemaField = convertToSchemaField(fieldName, originalDecoratorName, decoratorArgs);
        if (schemaField) {
          fields.push({
            name: schemaField.name,
            kind: schemaField.kind,
            type: schemaField.type,
            options: schemaField.options,
            tsType: typeInfo?.type,
          });
          isSchemaField = true;
          break;
        }
      }
    }

    // Not a schema field -> behavior
    if (!isSchemaField) {
      behaviors.push({
        name: fieldName,
        originalKey,
        value: property.text(),
        typeInfo,
        isObjectMethod: isClassMethodSyntax(property),
        kind: determineBehaviorKind(property),
      });
    }
  }

  // Process method definitions (always behaviors)
  for (const method of methodDefinitions) {
    const nameNode = method.field('name');
    if (!nameNode) continue;

    const methodName = nameNode.text();

    // Collect decorators
    const decorators: string[] = [];
    const siblings = method.parent()?.children() ?? [];
    const methodIndex = siblings.indexOf(method);

    for (let i = methodIndex - 1; i >= 0; i--) {
      const sibling = siblings[i];
      if (!sibling) continue;
      if (sibling.kind() === NODE_KIND_DECORATOR) {
        decorators.unshift(sibling.text());
      } else if (sibling.text().trim() !== '') {
        break;
      }
    }

    const methodText = decorators.length > 0 ? decorators.join('\n') + '\n' + method.text() : method.text();

    let typeInfo: ExtractedType | undefined;
    if (!isJavaScript) {
      try {
        typeInfo = extractTypeFromMethod(method, options) ?? undefined;
      } catch {
        // Ignore type extraction errors
      }
    }

    behaviors.push({
      name: methodName,
      originalKey: methodName,
      value: methodText,
      typeInfo,
      isObjectMethod: isClassMethodSyntax(method),
      kind: determineBehaviorKind(method),
    });
  }

  return { fields, behaviors, traits, baseClass };
}

// ============================================================================
// Mixin Data Extraction
// ============================================================================

interface ExtractedMixinData {
  fields: ParsedField[];
  behaviors: ParsedBehavior[];
  traits: string[];
}

function findMixinCreateCalls(root: SgNode, mixinLocalName: string): SgNode[] {
  const calls: SgNode[] = [];
  const callExpressions = root.findAll({ rule: { kind: NODE_KIND_CALL_EXPRESSION } });

  for (const callExpr of callExpressions) {
    const functionNode = callExpr.field('function');
    if (!functionNode) continue;

    const funcText = functionNode.text();
    if (funcText.includes(`${mixinLocalName}.create`) || funcText.includes(`${mixinLocalName}.createWithMixins`)) {
      calls.push(callExpr);
    }
  }

  return calls;
}

function extractMixinData(root: SgNode, filePath: string, options: TransformOptions): ExtractedMixinData {
  const fields: ParsedField[] = [];
  const behaviors: ParsedBehavior[] = [];
  const traits: string[] = [];

  const isJavaScript = filePath.endsWith('.js');

  const mixinImportLocal = findEmberImportLocalName(root, [DEFAULT_MIXIN_SOURCE], options, filePath, process.cwd());

  if (!mixinImportLocal) {
    return { fields, behaviors, traits };
  }

  const emberDataSources = [
    options.emberDataImportSource || DEFAULT_EMBER_DATA_SOURCE,
    'ember-data-model-fragments/attributes',
    WARP_DRIVE_MODEL,
  ];
  const emberDataImports = getEmberDataImports(root, emberDataSources, options);
  const mixinCreateCalls = findMixinCreateCalls(root, mixinImportLocal);

  if (mixinCreateCalls.length === 0) {
    return { fields, behaviors, traits };
  }

  const mixinCall = mixinCreateCalls[0];
  if (!mixinCall) {
    return { fields, behaviors, traits };
  }

  const args = mixinCall.field('arguments');
  if (!args) {
    return { fields, behaviors, traits };
  }

  const argChildren = args.children();
  const objectLiterals: SgNode[] = [];

  for (const arg of argChildren) {
    if (arg.kind() === 'object') {
      objectLiterals.push(arg);
    }
  }

  // Extract extended traits from identifier arguments (e.g., Mixin.create(BaseModelDate, PartialSaveable, { ... }))
  for (const arg of argChildren) {
    if (arg.kind() === NODE_KIND_IDENTIFIER) {
      const traitName = mixinNameToKebab(arg.text());
      if (!traits.includes(traitName)) {
        traits.push(traitName);
      }
    }
  }

  const objectLiteral = objectLiterals[objectLiterals.length - 1];
  if (!objectLiteral) {
    return { fields, behaviors, traits };
  }

  const directProperties = objectLiteral.children().filter((child) => {
    const kind = child.kind();
    return kind === NODE_KIND_PAIR || kind === NODE_KIND_METHOD_DEFINITION;
  });

  for (const property of directProperties) {
    let keyNode: SgNode | null = null;
    let valueNode: SgNode | null = null;
    let fieldName = '';
    let originalKey = '';
    let typeInfo: ExtractedType | undefined;

    if (property.kind() === NODE_KIND_METHOD_DEFINITION) {
      keyNode = property.field('name');
      valueNode = property;
      fieldName = keyNode?.text() || '';
      originalKey = fieldName;

      if (!isJavaScript) {
        try {
          typeInfo = extractTypeFromMethod(property, options) ?? undefined;
        } catch {
          // Ignore type extraction errors
        }
      }
    } else {
      keyNode = property.field('key');
      valueNode = property.field('value');
      originalKey = keyNode?.text() || '';
      fieldName = removeQuoteChars(originalKey);
    }

    if (!keyNode || !valueNode || !fieldName) continue;

    if (property.kind() === NODE_KIND_PAIR && valueNode.kind() === NODE_KIND_CALL_EXPRESSION) {
      const functionNode = valueNode.field('function');
      if (functionNode) {
        const functionName = functionNode.text();

        if (emberDataImports.has(functionName)) {
          const originalDecoratorName = emberDataImports.get(functionName);
          if (!originalDecoratorName) continue;

          const decoratorArgs = parseDecoratorArgumentsWithNodes(valueNode);
          const schemaField = convertToSchemaField(fieldName, originalDecoratorName, decoratorArgs);

          if (schemaField) {
            fields.push({
              name: schemaField.name,
              kind: schemaField.kind,
              type: schemaField.type,
              options: schemaField.options,
              tsType: typeInfo?.type,
            });
            continue;
          }
        }
      }
    }

    behaviors.push({
      name: fieldName,
      originalKey,
      value: valueNode.text(),
      typeInfo,
      isObjectMethod: property.kind() === NODE_KIND_METHOD_DEFINITION,
      kind: property.kind() === NODE_KIND_METHOD_DEFINITION ? 'method' : 'property',
    });
  }

  return { fields, behaviors, traits };
}

// ============================================================================
// File Type Detection
// ============================================================================

function detectFileType(root: SgNode, filePath: string, options: TransformOptions): ParsedFile['fileType'] {
  // Check for mixin pattern first
  const mixinImportLocal = findEmberImportLocalName(root, [DEFAULT_MIXIN_SOURCE], options, filePath, process.cwd());
  if (mixinImportLocal) {
    return 'mixin';
  }

  // Check for fragment
  const fragmentImportLocal = findEmberImportLocalName(root, [FRAGMENT_BASE_SOURCE], options, filePath, process.cwd());
  if (fragmentImportLocal) {
    const defaultExport = findDefaultExport(root, options);
    if (defaultExport) {
      const classDecl = findClassDeclarationInRoot(root, options);
      if (classDecl) {
        const heritage = classDecl.find({ rule: { kind: NODE_KIND_CLASS_HERITAGE } });
        if (heritage?.text().includes(fragmentImportLocal)) {
          return 'fragment';
        }
      }
    }
  }

  // Check for model
  const modelSources = [
    options.emberDataImportSource || DEFAULT_EMBER_DATA_SOURCE,
    ...(options.importSubstitutes?.map((s) => s.import) ?? []),
    WARP_DRIVE_MODEL,
  ].filter(Boolean);

  const modelImportLocal = findEmberImportLocalName(root, modelSources, options, filePath, process.cwd());
  if (modelImportLocal) {
    return 'model';
  }

  // Check for intermediate fragment paths (classes extending an intermediate fragment base class)
  if (options.intermediateFragmentPaths && options.intermediateFragmentPaths.length > 0) {
    const importStatements = root.findAll({ rule: { kind: NODE_KIND_IMPORT_STATEMENT } });
    for (const importNode of importStatements) {
      const source = importNode.field('source');
      if (!source) continue;
      const sourceText = removeQuoteChars(source.text());
      if (options.intermediateFragmentPaths.includes(sourceText)) {
        return 'model';
      }
    }
  }

  return 'unknown';
}

// ============================================================================
// Main Parse Function
// ============================================================================

/**
 * Parse a file into an intermediate ParsedFile structure.
 *
 * This function performs AST parsing once and extracts all necessary information
 * including imports, fields, behaviors, and metadata. The resulting structure
 * can be reused throughout the migration process without re-parsing.
 *
 * @param filePath - Absolute path to the file
 * @param code - Raw source code of the file
 * @param options - Transform options including configuration
 * @returns ParsedFile structure with all extracted information
 */
export function parseFile(filePath: string, code: string, options: TransformOptions): ParsedFile {
  const lang = getLanguageFromPath(filePath);
  const ast = parse(lang, code);
  const root = ast.root();

  const baseName = extractBaseName(filePath);
  const pascalName = extractPascalCaseName(filePath);
  const camelName = extractCamelCaseName(filePath);
  const extension: '.ts' | '.js' = filePath.endsWith('.ts') ? '.ts' : '.js';

  const imports = parseImports(root, options);
  const fileType = detectFileType(root, filePath, options);

  let fields: ParsedField[] = [];
  let behaviors: ParsedBehavior[] = [];
  let traits: string[] = [];
  let baseClass: string | undefined;

  if (fileType === 'model' || fileType === 'fragment') {
    const modelData = extractModelData(root, filePath, options);
    fields = modelData.fields;
    behaviors = modelData.behaviors;
    traits = modelData.traits;
    baseClass = modelData.baseClass;
  } else if (fileType === 'mixin') {
    const mixinData = extractMixinData(root, filePath, options);
    fields = mixinData.fields;
    behaviors = mixinData.behaviors;
    traits = mixinData.traits;
  }

  const hasExtension = behaviors.length > 0;

  debugLog(
    options,
    `Parsed ${filePath}: type=${fileType}, fields=${fields.length}, behaviors=${behaviors.length}, traits=${traits.length}`
  );

  return {
    name: baseName,
    path: filePath,
    extension,
    imports,
    fields,
    behaviors,
    fileType,
    traits,
    hasExtension,
    baseClass,
    pascalName,
    camelName,
    baseName,
    source: code,
  };
}
