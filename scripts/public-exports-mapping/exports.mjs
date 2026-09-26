import { readFileSync } from 'node:fs';
import ts from 'typescript';

/**
 * Where an exported name comes from. `module` is the specifier as written, relative or bare.
 * @typedef {{ kind: 'local', typeOnly: boolean }
 *   | { kind: 'reexport', module: string, name: string, typeOnly: boolean }} ExportSource
 */

/**
 * @typedef {object} ModuleExports
 * @property {Map<string, ExportSource>} named  every exported name, `default` included
 * @property {{ module: string, typeOnly: boolean }[]} stars  each `export * from`, in source order
 */

/**
 * What one source file exports, read from its top-level statements.
 * @param {string} file
 * @returns {ModuleExports}
 */
export function parseModule(file) {
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  /** @type {Map<string, ExportSource>} */
  const imports = new Map();
  /** @type {Map<string, ExportSource>} */
  const named = new Map();
  const stars = [];
  const local = (typeOnly) => ({ kind: /** @type {const} */ ('local'), typeOnly });
  const add = (name, from) => {
    // A value and a type declared under one name are one export, and it is a value.
    const typeOnly = (named.get(name)?.typeOnly ?? true) && from.typeOnly;
    named.set(name, { ...from, typeOnly });
  };

  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement) && statement.importClause) {
      const { importClause } = statement;
      const module = statement.moduleSpecifier.text;
      const typeOnly = importClause.isTypeOnly;
      if (importClause.name) {
        imports.set(importClause.name.text, { kind: 'reexport', module, name: 'default', typeOnly });
      }
      if (importClause.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
        for (const element of importClause.namedBindings.elements) {
          const name = (element.propertyName ?? element.name).text;
          imports.set(element.name.text, { kind: 'reexport', module, name, typeOnly: typeOnly || element.isTypeOnly });
        }
      }
    } else if (ts.isExportDeclaration(statement)) {
      const module = statement.moduleSpecifier?.text;
      if (!statement.exportClause) {
        stars.push({ module, typeOnly: statement.isTypeOnly });
      } else if (ts.isNamespaceExport(statement.exportClause)) {
        add(statement.exportClause.name.text, local(statement.isTypeOnly));
      } else {
        for (const element of statement.exportClause.elements) {
          const name = (element.propertyName ?? element.name).text;
          const typeOnly = statement.isTypeOnly || element.isTypeOnly;
          const imported = module ? null : imports.get(name);
          add(
            element.name.text,
            module
              ? { kind: 'reexport', module, name, typeOnly }
              : imported
                ? { ...imported, typeOnly: imported.typeOnly || typeOnly }
                : local(typeOnly)
          );
        }
      }
    } else if (ts.isExportAssignment(statement)) {
      const name = ts.isIdentifier(statement.expression) ? statement.expression.text : null;
      add('default', imports.get(name) ?? local(false));
    } else if (ts.canHaveModifiers(statement)) {
      const modifiers = ts.getModifiers(statement) ?? [];
      if (!modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) continue;
      const typeOnly = ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement);
      if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name)) add(declaration.name.text, local(false));
        }
      } else if (modifiers.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) {
        add('default', local(typeOnly));
      } else if (statement.name) {
        add(statement.name.text, local(typeOnly));
      }
    }
  }

  return { named, stars };
}
