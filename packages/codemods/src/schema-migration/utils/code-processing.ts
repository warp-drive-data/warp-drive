import type { SgNode } from '@ast-grep/napi';
import { existsSync } from 'fs';

import { removeQuoteChars } from './string.js';

export { parseObjectPropertiesFromNode } from './ast-helpers.js';

/** AST node kind for identifier nodes */
export const NODE_KIND_IDENTIFIER = 'identifier';

/** AST node kind for string literals */
export const NODE_KIND_STRING = 'string';

/** AST node kind for object literals */
export const NODE_KIND_OBJECT = 'object';

/** AST node kind for call expressions */
export const NODE_KIND_CALL_EXPRESSION = 'call_expression';

/** AST node kind for member expressions */
export const NODE_KIND_MEMBER_EXPRESSION = 'member_expression';

/** AST node kind for import statements */
export const NODE_KIND_IMPORT_STATEMENT = 'import_statement';

/** AST node kind for import clauses */
export const NODE_KIND_IMPORT_CLAUSE = 'import_clause';

/** AST node kind for decorator nodes */
export const NODE_KIND_DECORATOR = 'decorator';

/** AST node kind for function expressions */
export const NODE_KIND_FUNCTION = 'function';

/** AST node kind for arrow function expressions */
export const NODE_KIND_ARROW_FUNCTION = 'arrow_function';

/** AST node kind for method definitions */
export const NODE_KIND_METHOD_DEFINITION = 'method_definition';

/** AST node kind for function arguments */
export const NODE_KIND_ARGUMENTS = 'arguments';

/** AST node kind for named imports */
export const NODE_KIND_NAMED_IMPORTS = 'named_imports';

/** AST node kind for import specifier */
export const NODE_KIND_IMPORT_SPECIFIER = 'import_specifier';

/** AST node kind for property identifiers */
export const NODE_KIND_PROPERTY_IDENTIFIER = 'property_identifier';

/** AST node kind for pair (key-value) nodes */
export const NODE_KIND_PAIR = 'pair';

/** AST node kind for computed property names */
export const NODE_KIND_COMPUTED_PROPERTY_NAME = 'computed_property_name';

/** AST node kind for as expressions (TypeScript type casts) */
export const NODE_KIND_AS_EXPRESSION = 'as_expression';

/** AST node kind for variable declarations */
export const NODE_KIND_VARIABLE_DECLARATION = 'variable_declaration';

/** AST node kind for lexical declarations (const/let) */
export const NODE_KIND_LEXICAL_DECLARATION = 'lexical_declaration';

/** AST node kind for variable declarators */
export const NODE_KIND_VARIABLE_DECLARATOR = 'variable_declarator';

/** AST node kind for boolean true */
export const NODE_KIND_TRUE = 'true';

/** AST node kind for boolean false */
export const NODE_KIND_FALSE = 'false';

/** AST node kind for number literals */
export const NODE_KIND_NUMBER = 'number';

/** AST node kind for class declarations */
export const NODE_KIND_CLASS_DECLARATION = 'class_declaration';

/** AST node kind for class body */
export const NODE_KIND_CLASS_BODY = 'class_body';

/** AST node kind for class heritage (extends clause) */
export const NODE_KIND_CLASS_HERITAGE = 'class_heritage';

/** AST node kind for field definitions */
export const NODE_KIND_FIELD_DEFINITION = 'field_definition';

/** TypeScript file extension */
export const FILE_EXTENSION_TS = '.ts';

/** JavaScript file extension */
export const FILE_EXTENSION_JS = '.js';

/** Regex to convert glob pattern wildcards to regex */
export const GLOB_WILDCARD_REGEX = /\*/g;

/**
 * Find import statements in the AST root
 */
export function findImportStatements(root: SgNode): SgNode[] {
  return root.findAll({ rule: { kind: NODE_KIND_IMPORT_STATEMENT } });
}

/**
 * Extract the source path from an import statement
 */
export function getImportSourcePath(importStatement: SgNode): string | null {
  const sourceNode = importStatement.find({ rule: { kind: NODE_KIND_STRING } });
  if (!sourceNode) {
    return null;
  }
  return removeQuoteChars(sourceNode.text());
}

/**
 * Get the import clause from an import statement
 */
export function getImportClause(importStatement: SgNode): SgNode | null {
  return importStatement.find({ rule: { kind: NODE_KIND_IMPORT_CLAUSE } });
}

/**
 * Extract identifier name from import clause (for default imports)
 */
export function getDefaultImportIdentifier(importClause: SgNode): string | null {
  const identifier = importClause.find({ rule: { kind: NODE_KIND_IDENTIFIER } });
  return identifier ? identifier.text() : null;
}

/**
 * Extract named import identifiers from import clause
 */
export function getNamedImportIdentifiers(importClause: SgNode): string[] {
  const namedImports = importClause.find({ rule: { kind: NODE_KIND_NAMED_IMPORTS } });
  if (!namedImports) {
    return [];
  }

  const specifiers = namedImports.findAll({ rule: { kind: NODE_KIND_IMPORT_SPECIFIER } });
  const identifiers: string[] = [];

  for (const specifier of specifiers) {
    const name = specifier.find({ rule: { kind: NODE_KIND_IDENTIFIER } });
    if (name) {
      identifiers.push(name.text());
    }
  }

  return identifiers;
}

/**
 * Find all decorator nodes in the AST
 */
export function findDecorators(root: SgNode): SgNode[] {
  return root.findAll({ rule: { kind: NODE_KIND_DECORATOR } });
}

/**
 * Find all call expressions in the AST
 */
export function findCallExpressions(root: SgNode): SgNode[] {
  return root.findAll({ rule: { kind: NODE_KIND_CALL_EXPRESSION } });
}

/**
 * Get the arguments node from a call expression
 */
export function getCallArguments(callNode: SgNode): SgNode | null {
  return callNode.find({ rule: { kind: NODE_KIND_ARGUMENTS } });
}

/**
 * Find string argument nodes within an arguments node
 */
export function findStringArguments(argumentsNode: SgNode): SgNode[] {
  return argumentsNode.findAll({ rule: { kind: NODE_KIND_STRING } });
}

/**
 * Find object argument nodes within an arguments node
 */
export function findObjectArguments(argumentsNode: SgNode): SgNode[] {
  return argumentsNode.findAll({ rule: { kind: NODE_KIND_OBJECT } });
}

/**
 * Find all identifiers within an arguments node
 */
export function findIdentifiersInArguments(argumentsNode: SgNode): SgNode[] {
  return argumentsNode.findAll({ rule: { kind: NODE_KIND_IDENTIFIER } });
}

/**
 * Find the first string argument in a list of nodes
 */
export function findStringArgument(argNodes: SgNode[]): string | null {
  for (const arg of argNodes) {
    if (arg.kind() === NODE_KIND_STRING) {
      return removeQuoteChars(arg.text());
    }
  }
  return null;
}

/**
 * Find the first object argument in a list of nodes
 */
export function findObjectArgument(argNodes: SgNode[]): SgNode | null {
  for (const arg of argNodes) {
    if (arg.kind() === NODE_KIND_OBJECT) {
      return arg;
    }
  }
  return null;
}

/**
 * Try to find a file with common extensions (.js, .ts)
 */
export function findFileWithExtensions(basePath: string): string | null {
  const possiblePaths = [basePath, `${basePath}${FILE_EXTENSION_JS}`, `${basePath}${FILE_EXTENSION_TS}`];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return path;
    }
  }

  return null;
}

/**
 * Convert a glob pattern to a regex pattern
 */
export function globPatternToRegex(pattern: string): RegExp {
  return new RegExp('^' + pattern.replace(GLOB_WILDCARD_REGEX, '(.*)') + '$');
}

/**
 * Check if a node is inside a decorator
 */
export function isInsideDecorator(node: SgNode): boolean {
  const parentDecorator = node.parent()?.parent();
  return parentDecorator !== null && parentDecorator !== undefined && parentDecorator.kind() === NODE_KIND_DECORATOR;
}

/**
 * Check if an import statement is a type-only import
 */
export function isTypeOnlyImport(importText: string): boolean {
  return importText.includes('import type');
}

/**
 * Check if an object literal text contains polymorphic: true
 */
export function isPolymorphicRelationship(objectText: string): boolean {
  return objectText.includes('polymorphic') && objectText.includes('true');
}

/**
 * Determine if a file is JavaScript based on its path extension
 */
export function isJavaScriptFileByPath(filePath: string): boolean {
  return filePath.endsWith(FILE_EXTENSION_JS);
}

/**
 * Determine if a file is TypeScript based on its path extension
 */
export function isTypeScriptFileByPath(filePath: string): boolean {
  return filePath.endsWith(FILE_EXTENSION_TS);
}

/**
 * Extract field name from a property key, removing surrounding quotes if present
 */
export function extractFieldNameFromKey(originalKey: string): string {
  if (
    (originalKey.startsWith('"') && originalKey.endsWith('"')) ||
    (originalKey.startsWith("'") && originalKey.endsWith("'"))
  ) {
    return originalKey.slice(1, -1);
  }
  return originalKey;
}

const KEYWORD_ASYNC = 'async ';
const KEYWORD_GENERATOR_FUNCTION = 'function*';
const KEYWORD_GENERATOR_ASTERISK = '*';
const KEYWORD_GET = 'get';
const KEYWORD_SET = 'set';

function isGetterOrSetterKey(keyText: string): boolean {
  return keyText === KEYWORD_GET || keyText === KEYWORD_SET;
}

function isAsyncOrGeneratorMethod(value: SgNode, propertyText: string): boolean {
  const valueKind = value.kind();
  if (valueKind !== NODE_KIND_FUNCTION && valueKind !== NODE_KIND_ARROW_FUNCTION) {
    return false;
  }
  return (
    propertyText.includes(KEYWORD_ASYNC) ||
    propertyText.includes(KEYWORD_GENERATOR_FUNCTION) ||
    propertyText.includes(KEYWORD_GENERATOR_ASTERISK)
  );
}

function isComputedPropertyWithFunction(property: SgNode): boolean {
  const key = property.field('key');
  if (key?.kind() !== NODE_KIND_COMPUTED_PROPERTY_NAME) {
    return false;
  }
  const value = property.field('value');
  return value?.kind() === NODE_KIND_FUNCTION;
}

/**
 * Determines if an AST node represents object method syntax that doesn't need key: value format
 * Handles: methods, getters, setters, async methods, generators, computed properties
 */
export function isObjectMethodSyntax(property: SgNode): boolean {
  const propertyKind = property.kind();

  if (propertyKind === NODE_KIND_METHOD_DEFINITION) {
    return true;
  }

  if (propertyKind === NODE_KIND_PAIR) {
    const key = property.field('key');
    if (key && isGetterOrSetterKey(key.text())) {
      return true;
    }

    const value = property.field('value');
    if (value && isAsyncOrGeneratorMethod(value, property.text())) {
      return true;
    }

    if (isComputedPropertyWithFunction(property)) {
      return true;
    }
  }

  return false;
}
