/**
 * What one source file exports, read from the oxc-parser module record.
 *
 * `module.staticExports` lists every export entry. Two of its answers are corrected from the
 * ESTree `program` and `module.staticImports`:
 *
 * - oxc folds `import { G } from './g'; export { G }` into one entry on the import statement and
 *   takes `isType` and the imported name from the import side only. `export type { G }` then
 *   reads as a value, and `import D from './d'; export { D }` names the local `D` instead of
 *   `default`. Both are re-read from the export specifier and the import binding.
 * - a `declare` form, a non-instantiated namespace and anything in a `.d.ts` file are types, and
 *   `export default abstract class` is a value; the declaration node decides.
 */
import { readFileSync } from 'node:fs';
import { parseSync } from 'oxc-parser';

/**
 * @typedef {'value' | 'type'} ExportKind
 *
 * @typedef {object} LocalExport A binding declared in this file: `export const a`, `export { a as b }`,
 *   `export default class A {}`. A default export's `local` is `default` whatever its local name.
 * @property {'local'} form
 * @property {string} name the exported name, `default` included
 * @property {ExportKind} kind
 * @property {string} local the local binding name
 * @property {boolean} deprecated the declaring statement (or the export specifier) carries `@deprecated`
 *
 * @typedef {object} ReExport A binding of another module: `export { a as b } from './x'`,
 *   `import { a } from './x'; export { a }`, `import a from './x'; export default a`.
 * @property {'reexport'} form
 * @property {string} name
 * @property {ExportKind} kind `type` when this file re-exports it type-only
 * @property {string} from the module specifier as written
 * @property {string} imported the name imported from `from`, `default` included
 * @property {boolean} deprecated the export specifier's own JSDoc carries `@deprecated`
 *
 * @typedef {object} NamespaceExport A namespace object: `export * as ns from './x'`,
 *   `import * as ns from './x'; export { ns }`.
 * @property {'namespace'} form
 * @property {string} name
 * @property {ExportKind} kind
 * @property {string} from
 * @property {boolean} deprecated
 *
 * @typedef {object} StarExport `export * from './x'`, `export type * from './x'`.
 * @property {'star'} form
 * @property {ExportKind} kind
 * @property {string} from
 *
 * @typedef {LocalExport | ReExport | NamespaceExport | StarExport} ExportRecord
 *
 * @typedef {object} FileExports
 * @property {ExportRecord[]} exports in source order
 * @property {string | null} forward the specifier when the file's only statements are `export *` (and
 *   `export type *`) of that one specifier
 * @property {string[]} errors parse errors, empty when the file parsed cleanly
 */

/** Files that may carry `<template>` tags. */
const TEMPLATE_TAG_FILE = /\.g[jt]s$/;

/**
 * @param {string} file
 * @returns {'js' | 'jsx' | 'ts' | 'tsx' | 'dts'}
 */
export function langFor(file) {
  if (file.endsWith('.d.ts')) return 'dts';
  if (/\.(c|m)?ts$/.test(file) || file.endsWith('.gts')) return 'ts';
  if (file.endsWith('.tsx')) return 'tsx';
  if (file.endsWith('.jsx')) return 'jsx';
  return 'js';
}

/**
 * @param {string} file absolute path
 * @returns {FileExports}
 */
export function exportsOfFile(file) {
  const source = readFileSync(file, 'utf8');
  return file.endsWith('.json') ? exportsOfJson(source) : exportsOfSource(file, source);
}

/**
 * A JSON module as bundlers expose it: the parsed value as `default`, and each top-level key
 * that is a valid identifier as a named export (`import { version } from './package.json'`).
 * @param {string} source
 * @returns {FileExports}
 */
export function exportsOfJson(source) {
  /** @type {unknown} */
  let value;
  try {
    value = JSON.parse(source);
  } catch (error) {
    return { exports: [], forward: null, errors: [String(error)] };
  }
  /** @type {ExportRecord[]} */
  const exports = [{ form: 'local', name: 'default', kind: 'value', local: 'default', deprecated: false }];
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of Object.keys(value)) {
      if (/^[A-Za-z_$][\w$]*$/.test(key)) {
        exports.push({ form: 'local', name: key, kind: 'value', local: key, deprecated: false });
      }
    }
  }
  return { exports, forward: null, errors: [] };
}

/**
 * @param {string} file the file name; its extension picks the language
 * @param {string} source
 * @returns {FileExports}
 */
export function exportsOfSource(file, source) {
  const text = TEMPLATE_TAG_FILE.test(file) ? blankTemplateTags(source) : source;
  const lang = langFor(file);
  const result = parseSync(file, text, { lang, sourceType: 'module' });
  const { program, module, comments } = result;
  const errors = result.errors.map((e) => e.message);
  const typesOnly = lang === 'dts';

  /** @type {Map<number, any>} top-level statements by start offset */
  const statements = new Map();
  for (const stmt of program.body) statements.set(stmt.start, stmt);
  const jsdoc = deprecationReader(comments, program.body);

  /** @type {Map<string, { from: string, imported: string, isType: boolean }>} */
  const imports = new Map();
  for (const entry of module.staticImports) {
    for (const binding of entry.entries) {
      imports.set(binding.localName.value, {
        from: entry.moduleRequest.value,
        imported: importedName(binding.importName),
        isType: binding.isType,
      });
    }
  }

  /** @type {Map<number, { spec: any, stmt: any }>} export specifiers by the start of their exported name */
  const specifiers = new Map();
  for (const stmt of program.body) {
    if (stmt.type !== 'ExportNamedDeclaration' || stmt.declaration) continue;
    for (const spec of stmt.specifiers) specifiers.set(spec.exported.start, { spec, stmt });
  }

  const locals = localDeclarations(program.body, typesOnly);

  /** @type {ExportRecord[]} */
  const exports = [];
  /** @param {boolean} isType */
  const kindOf = (isType) => (typesOnly || isType ? 'type' : 'value');

  for (const group of module.staticExports) {
    const stmt = statements.get(group.start);
    for (const entry of group.entries) {
      const from = entry.moduleRequest?.value ?? null;

      if (entry.importName.kind === 'AllButDefault') {
        exports.push({
          form: 'star',
          kind: kindOf(entry.isType || stmt?.exportKind === 'type'),
          from: /** @type {string} */ (from),
        });
        continue;
      }

      if (entry.importName.kind === 'All') {
        exports.push({
          form: 'namespace',
          name: /** @type {string} */ (entry.exportName.name),
          kind: kindOf(entry.isType || stmt?.exportKind === 'type'),
          from: /** @type {string} */ (from),
          deprecated: jsdoc.statement(stmt),
        });
        continue;
      }

      const name = entry.exportName.kind === 'Default' ? 'default' : /** @type {string} */ (entry.exportName.name);
      const found =
        entry.exportName.kind === 'Name' ? specifiers.get(/** @type {number} */ (entry.exportName.start)) : undefined;
      const specIsType = found ? found.stmt.exportKind === 'type' || found.spec.exportKind === 'type' : false;
      const specDeprecated = found ? jsdoc.specifier(found.spec, found.stmt) : false;

      // `export { a as b } from './x'`, or an import folded into an export by oxc
      if (from !== null) {
        if (stmt?.type === 'ImportDeclaration' && found) {
          const binding = imports.get(found.spec.local.name ?? found.spec.local.value);
          if (binding) {
            exports.push(bindingExport(name, binding, binding.isType || specIsType, specDeprecated, kindOf));
            continue;
          }
        }
        exports.push({
          form: 'reexport',
          name,
          kind: kindOf(entry.isType || specIsType),
          from,
          imported: importedName(entry.importName),
          deprecated: specDeprecated,
        });
        continue;
      }

      // `export default <expression | declaration>`
      if (entry.exportName.kind === 'Default') {
        const declaration = stmt?.declaration;
        if (declaration?.type === 'Identifier') {
          const binding = imports.get(declaration.name);
          if (binding) {
            exports.push(bindingExport(name, binding, binding.isType, jsdoc.statement(stmt), kindOf));
            continue;
          }
          const local = locals.get(declaration.name);
          exports.push({
            form: 'local',
            name,
            kind: kindOf(local ? local.kind === 'type' : false),
            local: 'default',
            deprecated: jsdoc.statement(stmt) || (local ? local.statements.some((s) => jsdoc.statement(s)) : false),
          });
          continue;
        }
        exports.push({
          form: 'local',
          name,
          kind: kindOf(declaration ? declarationKind(declaration, typesOnly) === 'type' : false),
          local: 'default',
          deprecated: jsdoc.statement(stmt),
        });
        continue;
      }

      // `export const a = 1`, `export class A {}`
      if (stmt?.type === 'ExportNamedDeclaration' && stmt.declaration) {
        exports.push({
          form: 'local',
          name,
          kind: kindOf(declarationKind(stmt.declaration, typesOnly) === 'type'),
          local: name,
          deprecated: jsdoc.statement(stmt),
        });
        continue;
      }

      // `export { a as b }` of a local binding or of an import oxc did not fold (a namespace import)
      const localName = found ? (found.spec.local.name ?? found.spec.local.value) : entry.localName.name;
      const binding = imports.get(localName);
      if (binding) {
        exports.push(bindingExport(name, binding, binding.isType || specIsType, specDeprecated, kindOf));
        continue;
      }
      const local = locals.get(localName);
      exports.push({
        form: 'local',
        name,
        kind: kindOf(specIsType || (local ? local.kind === 'type' : false)),
        local: name === 'default' ? 'default' : localName,
        deprecated: specDeprecated || (local ? local.statements.some((s) => jsdoc.statement(s)) : false),
      });
    }
  }

  return { exports, forward: forwardOf(program.body), errors };
}

/**
 * @param {string} name
 * @param {{ from: string, imported: string }} binding
 * @param {boolean} isType
 * @param {boolean} deprecated
 * @param {(isType: boolean) => ExportKind} kindOf
 * @returns {ReExport | NamespaceExport}
 */
function bindingExport(name, binding, isType, deprecated, kindOf) {
  if (binding.imported === '*') {
    return { form: 'namespace', name, kind: kindOf(isType), from: binding.from, deprecated };
  }
  return { form: 'reexport', name, kind: kindOf(isType), from: binding.from, imported: binding.imported, deprecated };
}

/**
 * @param {{ kind: string, name: string | null }} importName
 * @returns {string} `default`, `*` for a namespace, else the name
 */
function importedName(importName) {
  if (importName.kind === 'Default') return 'default';
  if (importName.kind === 'NamespaceObject' || importName.kind === 'All') return '*';
  return /** @type {string} */ (importName.name);
}

/**
 * `forward` per the contract: every statement is `export *` / `export type *` of one specifier.
 * @param {any[]} body
 * @returns {string | null}
 */
function forwardOf(body) {
  let specifier = null;
  let count = 0;
  for (const stmt of body) {
    if (stmt.type === 'EmptyStatement') continue;
    if (stmt.type !== 'ExportAllDeclaration' || stmt.exported) return null;
    if (specifier !== null && specifier !== stmt.source.value) return null;
    specifier = stmt.source.value;
    count++;
  }
  return count ? specifier : null;
}

/**
 * Top-level bindings declared in this file, with the statements that declare them.
 * @param {any[]} body
 * @param {boolean} typesOnly
 * @returns {Map<string, { kind: ExportKind, statements: any[] }>}
 */
function localDeclarations(body, typesOnly) {
  /** @type {Map<string, { kind: ExportKind, statements: any[] }>} */
  const locals = new Map();
  /**
   * @param {string} name
   * @param {ExportKind} kind
   * @param {any} stmt
   */
  const add = (name, kind, stmt) => {
    const known = locals.get(name);
    if (!known) locals.set(name, { kind, statements: [stmt] });
    else {
      if (kind === 'value') known.kind = 'value';
      if (!known.statements.includes(stmt)) known.statements.push(stmt);
    }
  };
  for (const stmt of body) {
    const declaration =
      (stmt.type === 'ExportNamedDeclaration' || stmt.type === 'ExportDefaultDeclaration') && stmt.declaration
        ? stmt.declaration
        : stmt;
    const kind = declarationKind(declaration, typesOnly);
    if (!kind) continue;
    for (const name of declaredNames(declaration)) add(name, kind, stmt);
  }
  return locals;
}

/**
 * @param {any} node a declaration node
 * @param {boolean} typesOnly
 * @returns {ExportKind | null} null when the node declares nothing
 */
function declarationKind(node, typesOnly) {
  switch (node.type) {
    case 'TSInterfaceDeclaration':
    case 'TSTypeAliasDeclaration':
      return 'type';
    case 'ClassDeclaration':
    case 'ClassExpression':
    case 'FunctionDeclaration':
    case 'FunctionExpression':
    case 'TSDeclareFunction':
    case 'VariableDeclaration':
    case 'TSEnumDeclaration':
      return typesOnly || node.declare ? 'type' : 'value';
    case 'TSModuleDeclaration':
      return typesOnly || node.declare || !isInstantiated(node) ? 'type' : 'value';
    case 'TSImportEqualsDeclaration':
      return typesOnly || node.importKind === 'type' ? 'type' : 'value';
    default:
      return node.type.endsWith('Expression') || node.type === 'Identifier' || node.type === 'Literal'
        ? typesOnly
          ? 'type'
          : 'value'
        : null;
  }
}

/**
 * A namespace that only holds types emits no runtime object.
 * @param {any} node a TSModuleDeclaration
 * @returns {boolean}
 */
function isInstantiated(node) {
  const body = node.body;
  if (!body) return false;
  if (body.type === 'TSModuleDeclaration') return isInstantiated(body);
  return body.body.some((/** @type {any} */ stmt) => {
    const inner = stmt.type === 'ExportNamedDeclaration' && stmt.declaration ? stmt.declaration : stmt;
    if (inner.type === 'TSInterfaceDeclaration' || inner.type === 'TSTypeAliasDeclaration') return false;
    if (inner.type === 'TSModuleDeclaration') return !inner.declare && isInstantiated(inner);
    if (inner.declare) return false;
    if (stmt.type === 'ExportNamedDeclaration' && !stmt.declaration && stmt.exportKind === 'type') return false;
    return true;
  });
}

/**
 * @param {any} node
 * @returns {string[]}
 */
function declaredNames(node) {
  if (node.type === 'VariableDeclaration') {
    return node.declarations.flatMap((/** @type {any} */ d) => patternNames(d.id));
  }
  if (node.type === 'TSModuleDeclaration') return node.id?.type === 'Identifier' ? [node.id.name] : [];
  return node.id?.name ? [node.id.name] : [];
}

/**
 * @param {any} pattern a binding pattern
 * @returns {string[]}
 */
function patternNames(pattern) {
  if (!pattern) return [];
  switch (pattern.type) {
    case 'Identifier':
      return [pattern.name];
    case 'ObjectPattern':
      return pattern.properties.flatMap((/** @type {any} */ p) =>
        patternNames(p.type === 'RestElement' ? p.argument : p.value)
      );
    case 'ArrayPattern':
      return pattern.elements.flatMap((/** @type {any} */ e) => patternNames(e));
    case 'RestElement':
      return patternNames(pattern.argument);
    case 'AssignmentPattern':
      return patternNames(pattern.left);
    default:
      return [];
  }
}

/**
 * Reads `@deprecated` from the JSDoc blocks that lead a statement or an export specifier.
 * Every `/** ... *\/` block between the previous sibling and the node counts, as for TypeScript.
 * @param {{ type: string, value: string, start: number, end: number }[]} comments sorted by start
 * @param {any[]} body
 */
function deprecationReader(comments, body) {
  /** @type {Map<any, number>} */
  const previousEnd = new Map();
  let end = 0;
  for (const stmt of body) {
    previousEnd.set(stmt, end);
    end = stmt.end;
  }

  /**
   * @param {number} floor
   * @param {number} start
   */
  const deprecatedBetween = (floor, start) => {
    // binary search for the first comment that starts at or after `floor`
    let lo = 0;
    let hi = comments.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (comments[mid].start < floor) lo = mid + 1;
      else hi = mid;
    }
    for (let i = lo; i < comments.length && comments[i].end <= start; i++) {
      const c = comments[i];
      if (c.type === 'Block' && c.value.startsWith('*') && /@deprecated\b/.test(c.value)) return true;
    }
    return false;
  };

  return {
    /** @param {any} stmt a top-level statement */
    statement(stmt) {
      if (!stmt || !previousEnd.has(stmt)) return false;
      return deprecatedBetween(/** @type {number} */ (previousEnd.get(stmt)), stmt.start);
    },
    /**
     * @param {any} spec an ExportSpecifier
     * @param {any} stmt its ExportNamedDeclaration
     */
    specifier(spec, stmt) {
      const index = stmt.specifiers.indexOf(spec);
      const floor = index > 0 ? stmt.specifiers[index - 1].end : stmt.start;
      return deprecatedBetween(floor, spec.start);
    },
  };
}

/**
 * Replaces each `<template>...</template>` block of a `.gjs`/`.gts` file with code of the same
 * length, so every offset (and the JSDoc lookup that uses them) still matches the original; the
 * block's newlines are kept wherever the replacement text does not cover them:
 * `0` where an expression is expected, `0;` in a class body or a block, and
 * `export default 0;` for a template-only component at the top level, which `content-tag`
 * turns into the module's default export.
 * @param {string} source
 * @returns {string}
 */
export function blankTemplateTags(source) {
  const out = source.split('');
  /** @type {('{' | '(' | '[' | '${')[]} */
  const stack = [];
  let lastSignificant = '';
  let lastWord = '';
  let i = 0;
  const n = source.length;
  const EXPRESSION_BEFORE = new Set([
    '=',
    '(',
    '[',
    ',',
    ':',
    '?',
    '!',
    '&',
    '|',
    '+',
    '-',
    '*',
    '/',
    '%',
    '<',
    '>',
    '~',
    '^',
  ]);
  const EXPRESSION_WORDS = new Set([
    'return',
    'default',
    'yield',
    'await',
    'typeof',
    'void',
    'case',
    'in',
    'of',
    'new',
    'delete',
    'throw',
  ]);

  /** @param {number} from */
  const skipString = (from) => {
    const quote = source[from];
    let j = from + 1;
    while (j < n && source[j] !== quote) {
      if (source[j] === '\\') j++;
      j++;
    }
    return j + 1;
  };

  while (i < n) {
    const ch = source[i];
    const next = source[i + 1];
    if (ch === '/' && next === '/') {
      const eol = source.indexOf('\n', i);
      i = eol === -1 ? n : eol;
      continue;
    }
    if (ch === '/' && next === '*') {
      const close = source.indexOf('*/', i + 2);
      i = close === -1 ? n : close + 2;
      continue;
    }
    if (ch === '"' || ch === "'") {
      i = skipString(i);
      lastSignificant = ch;
      lastWord = '';
      continue;
    }
    if (ch === '`') {
      // template literal; `${` re-enters code until the matching `}`
      let j = i + 1;
      while (j < n && source[j] !== '`') {
        if (source[j] === '\\') j += 2;
        else if (source[j] === '$' && source[j + 1] === '{') break;
        else j++;
      }
      if (source[j] === '$') {
        stack.push('${');
        i = j + 2;
        lastSignificant = '{';
        lastWord = '';
      } else {
        i = j + 1;
        lastSignificant = '`';
        lastWord = '';
      }
      continue;
    }
    if (ch === '}' && stack[stack.length - 1] === '${') {
      // back into the template literal
      stack.pop();
      let j = i + 1;
      while (j < n && source[j] !== '`') {
        if (source[j] === '\\') j += 2;
        else if (source[j] === '$' && source[j + 1] === '{') break;
        else j++;
      }
      if (source[j] === '$') {
        stack.push('${');
        i = j + 2;
      } else {
        i = j + 1;
        lastSignificant = '`';
        lastWord = '';
      }
      continue;
    }
    if (ch === '<' && source.startsWith('<template', i) && /[\s>]/.test(source[i + 9] ?? '')) {
      const close = source.indexOf('</template>', i);
      if (close === -1) break;
      const end = close + '</template>'.length;
      const expression = EXPRESSION_BEFORE.has(lastSignificant) || EXPRESSION_WORDS.has(lastWord);
      const topLevel = stack.length === 0 && !expression;
      const replacement = expression ? '0' : topLevel ? 'export default 0;' : '0;';
      for (let k = i; k < end; k++) out[k] = source[k] === '\n' ? '\n' : ' ';
      for (let k = 0; k < replacement.length; k++) out[i + k] = replacement[k];
      i = end;
      lastSignificant = ';';
      lastWord = '';
      continue;
    }
    if (ch === '{' || ch === '(' || ch === '[') stack.push(ch);
    else if (ch === '}' || ch === ')' || ch === ']') stack.pop();
    if (/[A-Za-z_$]/.test(ch)) {
      let j = i;
      while (j < n && /[\w$]/.test(source[j])) j++;
      lastWord = source.slice(i, j);
      lastSignificant = 'w';
      i = j;
      continue;
    }
    if (!/\s/.test(ch)) {
      lastSignificant = ch;
      lastWord = '';
    }
    i++;
  }
  return out.join('');
}
