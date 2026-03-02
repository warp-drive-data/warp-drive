import { type Lang, parse, type SgNode } from '@ast-grep/napi';

import { logger } from '../../../utils/logger.js';
import type { TransformOptions } from '../config.js';
import type { SchemaArtifact } from './artifact.js';
import { findClassDeclaration, findDefaultExport, getEmberDataImports } from './ast-helpers.js';
import { getExtensionArtifactType } from './extension-generation.js';
import { DEFAULT_EMBER_DATA_SOURCE } from './import-utils.js';
import { getFileExtension, getLanguageFromPath, removeQuotes } from './path-utils.js';
import type { TransformArtifact } from './schema-generation.js';

const log = logger.for('extension');

const WARP_DRIVE_MODEL = '@warp-drive/model';
const FRAGMENT_DECORATOR_SOURCE = 'ember-data-model-fragments/attributes';
const FRAGMENT_BASE_SOURCE = 'ember-data-model-fragments/fragment';

/** Original (non-aliased) decorator names from ember-data that represent schema fields */
const SCHEMA_DECORATOR_NAMES = new Set(['attr', 'belongsTo', 'hasMany', 'fragment', 'fragmentArray', 'array']);

/**
 * Extract the local binding names introduced by an import statement.
 * Returns an empty array for side-effect imports (`import 'foo'`).
 */
function getImportLocalNames(importNode: SgNode): string[] {
  const names: string[] = [];
  const importClause = importNode.children().find((c) => c.kind() === 'import_clause');
  if (!importClause) return names;

  for (const child of importClause.children()) {
    if (child.kind() === 'identifier') {
      // Default import: import Foo from '...'
      names.push(child.text());
    } else if (child.kind() === 'namespace_import') {
      // Namespace import: import * as Foo from '...'
      const id = child.find({ rule: { kind: 'identifier' } });
      if (id) names.push(id.text());
    } else if (child.kind() === 'named_imports') {
      // Named imports: import { foo, bar as baz }
      for (const specifier of child.findAll({ rule: { kind: 'import_specifier' } })) {
        const alias = specifier.field('alias');
        const name = specifier.field('name');
        if (alias) {
          names.push(alias.text());
        } else if (name) {
          names.push(name.text());
        }
      }
    }
  }

  return names;
}

/**
 * Re-parse `source` and remove any import statements whose locally-bound
 * identifiers are not referenced anywhere outside of import statements.
 */
function removeUnusedImports(source: string, lang: Lang): string {
  const ast = parse(lang, source);
  const root = ast.root();
  const importNodes = root.findAll({ rule: { kind: 'import_statement' } });
  if (importNodes.length === 0) return source;

  // Build a version of the source with all imports stripped, used to check references.
  let nonImportSource = source;
  for (const imp of importNodes) {
    nonImportSource = nonImportSource.replace(imp.text(), '');
  }

  type Edit = ReturnType<SgNode['replace']>;
  const edits: Edit[] = [];

  for (const imp of importNodes) {
    const localNames = getImportLocalNames(imp);
    if (localNames.length === 0) continue; // side-effect import – always keep

    const isUsed = localNames.some((name) => new RegExp(`\\b${name}\\b`).test(nonImportSource));
    if (!isUsed) {
      edits.push(imp.replace(''));
    }
  }

  return edits.length > 0 ? root.commitEdits(edits) : source;
}

/**
 * Insert `import type { typeName } from 'importPath';` after the last existing
 * import statement in `source`.  If there are no imports, prepend to the file.
 */
function addTypeImport(source: string, lang: Lang, typeName: string, importPath: string): string {
  const ast = parse(lang, source);
  const root = ast.root();
  const typeImportLine = `import type { ${typeName} } from '${importPath}';`;

  const importNodes = root.findAll({ rule: { kind: 'import_statement' } });
  if (importNodes.length > 0) {
    const lastImport = importNodes[importNodes.length - 1];
    type Edit = ReturnType<SgNode['replace']>;
    const edits: Edit[] = [lastImport.replace(lastImport.text() + '\n' + typeImportLine)];
    return root.commitEdits(edits);
  }

  return typeImportLine + '\n' + source;
}

function getModelImportSources(options: TransformOptions): string[] {
  return [
    options.emberDataImportSource || DEFAULT_EMBER_DATA_SOURCE,
    WARP_DRIVE_MODEL,
    FRAGMENT_DECORATOR_SOURCE,
    FRAGMENT_BASE_SOURCE,
    ...(options.importSubstitutes?.map((s) => s.import) ?? []),
  ].filter(Boolean);
}

function getDecoratorName(decorator: SgNode): string {
  return decorator.text().replace('@', '').split('(')[0].trim();
}

function isSchemaDecorated(node: SgNode, schemaDecoratorLocalNames: Set<string>): boolean {
  const decorators = node.findAll({ rule: { kind: 'decorator' } });
  return decorators.some((d) => schemaDecoratorLocalNames.has(getDecoratorName(d)));
}

function findDirectFields(classBody: SgNode): SgNode[] {
  for (const fieldKind of ['field_definition', 'public_field_definition', 'class_field']) {
    try {
      const fields = classBody.findAll({
        rule: {
          kind: fieldKind,
          inside: { kind: 'class_body', stopBy: 'neighbor' },
        },
      });
      if (fields.length > 0) return fields;
    } catch {
      // Kind not valid in this grammar, try next
    }
  }
  return [];
}

/**
 * "Extensions" are whatever remains of a Model or Mixin after we extract all
 * of the schema-related information.
 *
 * For instance for a Model, this means dropping extension of the base class,
 * and dropping any properties decorated with @attr @hasMany or @belongsTo,
 * as well as any imports or local definitions that are only used by those
 * properties.
 */
export function createExtension(
  options: TransformOptions,
  config: SchemaArtifact,
  originalFilePath: string,
  originalSource: string
): TransformArtifact {
  const lang = getLanguageFromPath(originalFilePath);
  const ast = parse(lang, originalSource);
  const root = ast.root();

  const modelSources = getModelImportSources(options);
  const emberDataImports = getEmberDataImports(root, modelSources, options);

  // Collect local names of schema decorators (handles aliases like `import { attr as edAttr }`)
  const schemaDecoratorLocalNames = new Set<string>();
  for (const [localName, originalName] of emberDataImports) {
    if (SCHEMA_DECORATOR_NAMES.has(originalName)) {
      schemaDecoratorLocalNames.add(localName);
    }
  }

  type Edit = ReturnType<SgNode['replace']>;
  const edits: Edit[] = [];

  // 1. Remove ember-data import statements
  const importStatements = root.findAll({ rule: { kind: 'import_statement' } });
  for (const importNode of importStatements) {
    const sourceField = importNode.field('source');
    if (!sourceField) continue;
    const importPath = removeQuotes(sourceField.text());
    if (modelSources.includes(importPath)) {
      edits.push(importNode.replace(''));
    }
  }

  // 2. Find the default export class
  const defaultExportNode = findDefaultExport(root, options);
  if (!defaultExportNode) {
    throw new Error(`No default export class found in ${originalFilePath}`);
  }

  const classDecl = findClassDeclaration(defaultExportNode, root, options);
  if (!classDecl) {
    throw new Error(`No class declaration found in ${originalFilePath}`);
  }

  const classBody = classDecl.find({ rule: { kind: 'class_body' } });
  if (!classBody) {
    throw new Error(`No class body found in ${originalFilePath}`);
  }

  const extensionName = config.identifiers.extension!;

  // 3. Remove schema-decorated fields (and their preceding JSDoc comments)
  const directFields = findDirectFields(classBody);
  for (const field of directFields) {
    if (isSchemaDecorated(field, schemaDecoratorLocalNames)) {
      const prevSibling = field.prev();
      if (prevSibling && prevSibling.kind() === 'comment') {
        edits.push(prevSibling.replace(''));
      }
      edits.push(field.replace(''));
    }
  }

  // 4. Transform the class header via AST edits (same pass as field removal)
  //    a) Rename the class identifier
  const classNameNode =
    classDecl.field('name') ??
    classDecl.children().find((c) => c.kind() === 'type_identifier' || c.kind() === 'identifier');
  if (classNameNode) {
    edits.push(classNameNode.replace(extensionName));
  }

  //    b) Remove `extends BaseClass` heritage clause
  const heritageNode = classDecl.find({ rule: { kind: 'class_heritage' } });
  if (heritageNode) {
    edits.push(heritageNode.replace(''));
  }

  // 5. Apply all edits atomically
  let newSource = root.commitEdits(edits);

  // 6a. Remove `default` keyword from `export default class ExtensionName`.
  //     The `default` keyword is an anonymous node in tree-sitter and may not be
  //     reachable via AST edit in all grammars, so we use a targeted string replacement
  //     on the already-renamed class identifier.
  newSource = newSource.replace(`export default class ${extensionName}`, `export class ${extensionName}`);

  // 6b. Add typed interface for TypeScript typed models (prepended before the class)
  if (config.extensionIsTyped && config.identifiers.type) {
    newSource = newSource.replace(
      `export class ${extensionName}`,
      `// @ts-ignore-error in reality fields are not merged, they are overridden\nexport interface ${extensionName} extends ${config.identifiers.type} {}\nexport class ${extensionName}`
    );
  }

  const fileExt = getFileExtension(originalFilePath);

  // 7. Remove imports that are no longer referenced after schema fields were stripped
  newSource = removeUnusedImports(newSource, lang);

  // 8. For typed extensions, import the resource type from the associated .type file
  if (config.extensionIsTyped && config.identifiers.type) {
    const typeImportPath = `./${config.name}.type${fileExt}`;
    newSource = addTypeImport(newSource, lang, config.identifiers.type, typeImportPath);
  }

  // 9. Append named export as default
  const finalSource = newSource.trimEnd() + '\n\nexport default ' + extensionName + ';\n';

  log.debug(`Created extension artifact for ${config.name}`);
  return {
    baseName: config.name,
    type: getExtensionArtifactType(config),
    name: extensionName,
    code: finalSource,
    suggestedFileName: `${config.name}.ext${fileExt}`,
  };
}
