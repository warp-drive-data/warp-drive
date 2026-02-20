import type { SgNode } from '@ast-grep/napi';
import { Lang, parse } from '@ast-grep/napi';

import type { TransformOptions } from '../config.js';
import { isMixinImportPath, isSpecialMixinImport } from './import-utils.js';
import { debugLog } from './logging.js';
import { getLanguageFromPath, removeQuotes } from './path-utils.js';
import { MIXIN_SUFFIX_REGEX } from './string.js';

/**
 * Find all export statements
 */
function findExportStatements(root: SgNode, options?: TransformOptions) {
  const exportStatements = root.findAll({ rule: { kind: 'export_statement' } });

  debugLog(options, `Found ${exportStatements.length} export statements`);
  for (const exportStatement of exportStatements) {
    debugLog(options, `Export statement: ${exportStatement.text().substring(0, 100)}...`);
  }

  return exportStatements;
}

/**
 * Find the default export statement in an AST
 */
export function findDefaultExport(root: SgNode, options?: TransformOptions): SgNode | null {
  const exportStatements = findExportStatements(root, options);

  for (const exportStatement of exportStatements) {
    const exportText = exportStatement.text();
    if (exportText.startsWith('export default')) {
      debugLog(options, 'Found default export');
      return exportStatement;
    }
  }

  debugLog(options, 'No default export found');

  return null;
}

/**
 * Get the identifier being exported in a default export
 */
export function getExportedIdentifier(exportNode: SgNode, options?: TransformOptions): string | null {
  if (options?.debug) {
    debugLog(options, 'Getting exported identifier from export node');
    debugLog(
      options,
      'Export children: ' +
        exportNode
          .children()
          .map((c) => `${c.kind()}: ${c.text()}`)
          .join(', ')
    );
  }

  // Look for an identifier being exported (not a call expression)
  const identifiers = exportNode.children().filter((child) => child.kind() === 'identifier');

  if (options?.debug) {
    debugLog(options, 'Found identifiers: ' + identifiers.map((id) => id.text()).join(', '));
  } // Find the identifier that's not 'default' or 'export'
  for (const identifier of identifiers) {
    const text = identifier.text();
    if (text !== 'default' && text !== 'export') {
      debugLog(options, `Found exported identifier: ${text}`);
      return text;
    }
  }

  debugLog(options, 'No exported identifier found');
  return null;
}

/**
 * Find a class declaration node, either directly in the export or by looking up the exported identifier
 * This is the single source of truth for class declaration finding across the codebase.
 */
export function findClassDeclaration(exportNode: SgNode, root: SgNode, options?: TransformOptions): SgNode | null {
  // Look for a class declaration in the export
  let classDeclaration = exportNode.find({ rule: { kind: 'class_declaration' } });

  // If no class declaration found in export, check if export references a class by name
  if (!classDeclaration) {
    debugLog(options, 'DEBUG: No class declaration found in export, checking for exported class name');

    // Get the exported identifier name
    const exportedIdentifier = getExportedIdentifier(exportNode, options);
    if (exportedIdentifier) {
      debugLog(options, `DEBUG: Found exported identifier: ${exportedIdentifier}`);

      // Look for a class declaration with this name in the root
      classDeclaration = root.find({
        rule: {
          kind: 'class_declaration',
          has: {
            kind: 'identifier',
            regex: exportedIdentifier,
          },
        },
      });

      if (classDeclaration) {
        debugLog(options, `DEBUG: Found class declaration for exported identifier: ${exportedIdentifier}`);
      }
    } else {
      debugLog(options, 'DEBUG: No exported identifier found');
    }
  }

  return classDeclaration;
}

/**
 * Parse decorator arguments from a decorator node, returning both text and AST nodes
 */
export function parseDecoratorArgumentsWithNodes(decorator: SgNode): { text: string[]; nodes: SgNode[] } {
  const text: string[] = [];
  const nodes: SgNode[] = [];

  // Find the arguments list in the decorator
  const argumentsList = decorator.find({ rule: { kind: 'arguments' } });
  if (!argumentsList) return { text, nodes };

  // Get all argument nodes
  const argumentNodes = argumentsList
    .children()
    .filter((child) => child.kind() !== '(' && child.kind() !== ')' && child.kind() !== ',');

  for (const arg of argumentNodes) {
    text.push(arg.text());
    nodes.push(arg);
  }

  return { text, nodes };
}

/**
 * Parse object properties from an AST object node
 * Handles proper type conversion for all JavaScript value types
 *
 * This is the single source of truth for object literal parsing across the codebase.
 */
export function parseObjectPropertiesFromNode(objectNode: SgNode): Record<string, unknown> {
  const optionsObj: Record<string, unknown> = {};
  const properties = objectNode.children().filter((child) => child.kind() === 'pair');

  for (const property of properties) {
    const keyNode = property.field('key');
    const valueNode = property.field('value');
    if (!keyNode || !valueNode) continue;

    const key = keyNode.text();
    // Remove quotes from key if present
    const cleanKey =
      key.startsWith('"') && key.endsWith('"')
        ? key.slice(1, -1)
        : key.startsWith("'") && key.endsWith("'")
          ? key.slice(1, -1)
          : key;

    // Extract the value based on its type
    let value: unknown;
    if (valueNode.kind() === 'string') {
      value = valueNode.text().slice(1, -1); // Remove quotes
    } else if (valueNode.kind() === 'true') {
      value = true;
    } else if (valueNode.kind() === 'false') {
      value = false;
    } else if (valueNode.kind() === 'number') {
      value = parseFloat(valueNode.text());
    } else if (valueNode.kind() === 'null') {
      value = null;
    } else if (valueNode.kind() === 'undefined') {
      value = undefined;
    } else {
      // For other types (like identifiers, member expressions), use the text representation
      value = valueNode.text();
    }

    optionsObj[cleanKey] = value;
  }

  return optionsObj;
}

/**
 * Parse an object literal from an AST node directly
 */
export function parseObjectLiteralFromNode(objectNode: SgNode): Record<string, unknown> {
  try {
    return parseObjectPropertiesFromNode(objectNode);
  } catch {
    // Return empty object if parsing fails
    return {};
  }
}

/**
 * Parse an object literal string using AST parsing for robust extraction
 * This is the single parser used throughout the codebase
 */
export function parseObjectLiteral(objectText: string): Record<string, unknown> {
  try {
    // Determine language based on the object text content
    const ast = parse(Lang.TypeScript, objectText);
    const root = ast.root();

    // Find the object literal
    const objectLiteral = root.find({ rule: { kind: 'object' } });
    if (!objectLiteral) {
      return {};
    }

    return parseObjectPropertiesFromNode(objectLiteral);
  } catch {
    // Return empty object if parsing fails
    return {};
  }
}

/**
 * Common transform wrapper that handles AST parsing, debug logging, and error handling
 */
export function withTransformWrapper<T>(
  filePath: string,
  source: string,
  options: TransformOptions,
  transformName: string,
  transformFn: (root: SgNode, source: string, filePath: string, options: TransformOptions) => T
): T | string {
  debugLog(options, `Starting ${transformName} transform for ${filePath} with debug enabled`);

  try {
    const lang = getLanguageFromPath(filePath);
    const ast = parse(lang, source);
    const root = ast.root();

    return transformFn(root, source, filePath, options);
  } catch (error) {
    // Import errorLog inline to avoid circular dependency
    if (options?.verbose) {
      // eslint-disable-next-line no-console
      console.error(`Error processing ${filePath}:`, error);
    }
    return source;
  }
}

/**
 * Look for interface definitions in the same file that might correspond to a mixin
 */
export function findAssociatedInterface(root: SgNode, mixinName: string, options?: TransformOptions): SgNode | null {
  debugLog(options, `Looking for interface associated with mixin: ${mixinName}`);

  // Convert mixin name to potential interface names
  // e.g., baseModelMixin -> BaseModelMixin, BaseModel, BaseModelInterface
  const potentialNames = [
    mixinName.charAt(0).toUpperCase() + mixinName.slice(1), // camelCase to PascalCase
    mixinName.charAt(0).toUpperCase() + mixinName.slice(1).replace(MIXIN_SUFFIX_REGEX, ''), // Remove Mixin suffix
    mixinName.charAt(0).toUpperCase() + mixinName.slice(1).replace(MIXIN_SUFFIX_REGEX, 'Interface'), // Replace with Interface
  ];

  // Find all interface declarations
  const interfaces = root.findAll({ rule: { kind: 'interface_declaration' } });

  for (const interfaceNode of interfaces) {
    const nameNode = interfaceNode.field('name');
    if (!nameNode) continue;

    const interfaceName = nameNode.text();
    if (potentialNames.includes(interfaceName)) {
      debugLog(options, `Found associated interface: ${interfaceName}`);
      return interfaceNode;
    }
  }

  debugLog(options, 'No associated interface found');
  return null;
}

/**
 * Get EmberData decorator imports and their local names
 */
export function getEmberDataImports(
  root: SgNode,
  expectedSources: string[] = ['@ember-data/model'],
  options?: TransformOptions
): Map<string, string> {
  const emberDataImports = new Map<string, string>();

  debugLog(options, 'Looking for EmberData imports from:', expectedSources);

  // Find all import statements
  const importStatements = root.findAll({ rule: { kind: 'import_statement' } });

  for (const importNode of importStatements) {
    // Get the source of the import (the string after 'from')
    const source = importNode.field('source');
    if (!source) continue;

    const sourceText = source.text();
    // Remove quotes from source text for comparison
    const cleanSourceText = removeQuotes(sourceText);

    // Check if this import is from one of our expected sources
    if (!expectedSources.includes(cleanSourceText)) {
      continue;
    }

    debugLog(options, `Found EmberData import from: ${cleanSourceText}`);

    // Get the import clause to find named imports
    const importClause = importNode.children().find((child) => child.kind() === 'import_clause');
    if (!importClause) continue;

    // Look for named imports within the import clause
    const namedImports = importClause.findAll({ rule: { kind: 'named_imports' } });
    for (const namedImportNode of namedImports) {
      // Get all import specifiers
      const importSpecifiers = namedImportNode.findAll({ rule: { kind: 'import_specifier' } });

      for (const specifier of importSpecifiers) {
        // Get the imported name and local name
        const nameNode = specifier.field('name'); // The original name from the module
        const aliasNode = specifier.field('alias'); // The local alias (if any)

        if (!nameNode) continue;

        const originalName = nameNode.text();
        const localName = aliasNode ? aliasNode.text() : originalName;

        debugLog(options, `Found EmberData decorator: ${originalName} as ${localName}`);

        emberDataImports.set(localName, originalName);
      }
    }
  }

  return emberDataImports;
}

/**
 * Get mixin imports and their local names, mapping local names to import paths
 */
export function getMixinImports(root: SgNode, options?: TransformOptions): Map<string, string> {
  const mixinImports = new Map<string, string>();

  debugLog(options, 'Looking for mixin imports');

  // Find all import statements
  const importStatements = root.findAll({ rule: { kind: 'import_statement' } });

  for (const importNode of importStatements) {
    // Get the source of the import (the string after 'from')
    const source = importNode.field('source');
    if (!source) continue;

    const sourceText = source.text();
    // Remove quotes from source text
    const importPath = removeQuotes(sourceText);

    // Process both relative imports and absolute imports that could be mixins
    // Skip node_modules imports but allow absolute imports that match mixin patterns
    if (!importPath.startsWith('./') && !importPath.startsWith('../')) {
      // Check if this is an absolute import that points to a mixin file
      const isMixin = isMixinImportPath(importPath, options);
      const isSpecial = isSpecialMixinImport(importPath, options);
      if (!isMixin && !isSpecial) {
        continue;
      }
    }

    debugLog(options, `Found potential mixin import from: ${importPath}`);

    // Handle special mixin imports (e.g., workflowable from models)
    let actualImportPath = importPath;
    if (isSpecialMixinImport(importPath, options)) {
      // Convert special mixin import to actual mixin path
      // Use the configured modelImportSource and mixinImportSource
      const modelImportSource = options?.modelImportSource;
      const mixinImportSource = options?.mixinImportSource;
      if (modelImportSource && mixinImportSource && importPath === `${modelImportSource}/workflowable`) {
        actualImportPath = `${mixinImportSource}/workflowable`;
      }
    }

    // Check for default imports
    const importClause = importNode.children().find((child) => child.kind() === 'import_clause');
    if (!importClause) continue;

    // Look for default import
    const identifierNodes = importClause.findAll({ rule: { kind: 'identifier' } });
    for (const identifierNode of identifierNodes) {
      const localName = identifierNode.text();
      // Skip 'from' keyword
      if (localName === 'from') continue;

      debugLog(options, `Found mixin import: ${localName} from ${actualImportPath}`);
      mixinImports.set(localName, actualImportPath);
      break; // Only take the first identifier for default imports
    }

    // Also look for named imports
    const namedImports = importClause.findAll({ rule: { kind: 'named_imports' } });
    for (const namedImportNode of namedImports) {
      const importSpecifiers = namedImportNode.findAll({ rule: { kind: 'import_specifier' } });

      for (const specifier of importSpecifiers) {
        const nameNode = specifier.field('name');
        const aliasNode = specifier.field('alias');

        if (!nameNode) continue;

        const originalName = nameNode.text();
        const localName = aliasNode ? aliasNode.text() : originalName;

        debugLog(options, `Found named mixin import: ${originalName} as ${localName} from ${actualImportPath}`);
        mixinImports.set(localName, actualImportPath);
      }
    }
  }

  return mixinImports;
}
