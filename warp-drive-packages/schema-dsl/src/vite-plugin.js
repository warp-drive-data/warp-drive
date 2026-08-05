import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { globSync } from 'glob';

const traverse = typeof _traverse === 'function' ? _traverse : _traverse.default;

const VIRTUAL_MODULE_ID = 'virtual:warp-drive-schemas';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

const STRING_DECAMELIZE_REGEXP = /([a-z\d])([A-Z])/g;
const STRING_DASHERIZE_REGEXP = /[ _]/g;

function dasherize(str) {
  return str.replace(STRING_DECAMELIZE_REGEXP, '$1_$2').toLowerCase().replace(STRING_DASHERIZE_REGEXP, '-');
}

function extractStringValue(node) {
  if (node && node.type === 'StringLiteral') return node.value;
  return undefined;
}

function extractObjectOptions(node) {
  const opts = {};
  if (!node || node.type !== 'ObjectExpression') return opts;

  for (const prop of node.properties) {
    if (prop.type !== 'ObjectProperty') continue;
    const key = prop.key.type === 'Identifier' ? prop.key.name : extractStringValue(prop.key);
    if (!key) continue;

    if (prop.value.type === 'StringLiteral') opts[key] = prop.value.value;
    else if (prop.value.type === 'BooleanLiteral') opts[key] = prop.value.value;
    else if (prop.value.type === 'NumericLiteral') opts[key] = prop.value.value;
  }

  return opts;
}

function decoratorName(node) {
  if (node.type !== 'Decorator') return null;
  const expr = node.expression;
  if (expr.type === 'Identifier') return expr.name;
  if (expr.type === 'CallExpression' && expr.callee.type === 'Identifier') return expr.callee.name;
  return null;
}

function parseResourceArgs(node) {
  if (node.type !== 'Decorator') return null;
  const expr = node.expression;

  if (expr.type === 'Identifier') return {};

  if (expr.type === 'CallExpression') {
    const args = expr.arguments;
    if (args.length === 0) return {};

    if (args[0].type === 'StringLiteral') {
      const opts = args[1] ? extractObjectOptions(args[1]) : {};
      return { type: args[0].value, legacy: opts.legacy, identityField: opts.identityField };
    }
    if (args[0].type === 'ObjectExpression') {
      const opts = extractObjectOptions(args[0]);
      return { legacy: opts.legacy, identityField: opts.identityField };
    }
  }

  return null;
}

function parseFieldArgs(node) {
  if (node.type !== 'Decorator') return null;
  const expr = node.expression;

  if (expr.type === 'Identifier') return {};
  if (expr.type === 'CallExpression' && expr.arguments.length > 0) {
    const opts = extractObjectOptions(expr.arguments[0]);
    return { type: opts.type, sourceKey: opts.sourceKey };
  }
  return null;
}

function parseIdArgs(node) {
  if (node.type !== 'Decorator') return null;
  const expr = node.expression;

  if (expr.type === 'Identifier') return {};
  if (expr.type === 'CallExpression' && expr.arguments.length > 0) {
    const opts = extractObjectOptions(expr.arguments[0]);
    return { sourceKey: opts.sourceKey };
  }
  return null;
}

function extractSchemas(source) {
  const ast = parse(source, {
    sourceType: 'module',
    plugins: ['typescript', ['decorators', { decoratorsBeforeExport: true }]],
  });

  const schemas = [];
  const importMap = {};

  traverse(ast, {
    ImportDeclaration(path) {
      if (path.node.source.value !== '@warp-drive/schema-dsl') return;

      for (const spec of path.node.specifiers) {
        if (spec.type === 'ImportSpecifier' && spec.imported.type === 'Identifier') {
          importMap[spec.local.name] = spec.imported.name;
        }
      }
    },

    ClassDeclaration(path) {
      const node = path.node;
      if (!node.decorators || node.decorators.length === 0) return;

      let resourceArgs = null;
      for (const dec of node.decorators) {
        const name = decoratorName(dec);
        if (!name) continue;
        const original = importMap[name] ?? name;
        if (original === 'Resource') {
          resourceArgs = parseResourceArgs(dec);
          break;
        }
      }
      if (!resourceArgs) return;

      const className = node.id?.name;
      const type = resourceArgs.type ?? (className ? dasherize(className) : 'unknown');
      const isLegacy = resourceArgs.legacy === true;

      const fields = [];
      let identity = null;

      for (const member of node.body.body) {
        if (member.type !== 'ClassProperty' || !member.decorators) continue;
        const propName = member.key.type === 'Identifier' ? member.key.name : null;
        if (!propName) continue;

        for (const dec of member.decorators) {
          const name = decoratorName(dec);
          if (!name) continue;
          const original = importMap[name] ?? name;

          if (original === 'field') {
            const opts = parseFieldArgs(dec);
            if (opts) {
              const f = { kind: 'field', name: propName };
              if (opts.type) f.type = opts.type;
              if (opts.sourceKey) f.sourceKey = opts.sourceKey;
              fields.push(f);
            }
            break;
          }
          if (original === 'id') {
            const opts = parseIdArgs(dec);
            if (opts) {
              identity = { kind: '@id', name: propName };
              if (opts.sourceKey) identity.sourceKey = opts.sourceKey;
            }
            break;
          }
        }
      }

      schemas.push({ type, isLegacy, identityField: resourceArgs.identityField, identity, fields });
    },
  });

  return schemas;
}

function toResourceSchema(info) {
  const identity = info.identity
    ? info.identity
    : info.identityField
      ? { kind: '@id', name: info.identityField }
      : { kind: '@id', name: 'id' };

  const fields = [];

  if (!info.isLegacy) {
    fields.push({ kind: 'derived', name: '$type', type: '@identity', options: { key: 'type' } });
  }

  for (const f of info.fields) {
    fields.push(f);
  }

  if (!info.isLegacy) {
    fields.push({ kind: 'derived', name: 'constructor', type: '@constructor' });
  }

  const schema = { type: info.type, identity, fields };
  if (info.isLegacy) schema.legacy = true;

  return schema;
}

/**
 * Vite plugin that compiles `@warp-drive/schema-dsl` decorated
 * classes into JSON resource schemas at build time.
 *
 * @param {{ schemas: string }} options
 * @returns {import('vite').Plugin}
 */
export function schemaDSL(options) {
  let root = '';

  return {
    name: 'warp-drive-schema-dsl',

    configResolved(config) {
      root = config.root;
    },

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID;
    },

    load(id) {
      if (id !== RESOLVED_VIRTUAL_MODULE_ID) return;

      const pattern = resolve(root, options.schemas);
      const files = globSync(pattern);
      const result = [];

      for (const file of files) {
        const source = readFileSync(file, 'utf-8');
        for (const info of extractSchemas(source)) {
          result.push(toResourceSchema(info));
        }
      }

      return `export default ${JSON.stringify(result, null, 2)};`;
    },
  };
}
