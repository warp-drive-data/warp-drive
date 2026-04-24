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

function extractPrimitiveValue(node) {
  if (!node) return undefined;
  if (node.type === 'StringLiteral') return node.value;
  if (node.type === 'BooleanLiteral') return node.value;
  if (node.type === 'NumericLiteral') return node.value;
  if (node.type === 'NullLiteral') return null;
  return undefined;
}

function extractObjectOptions(node) {
  const opts = {};
  if (!node || node.type !== 'ObjectExpression') return opts;

  for (const prop of node.properties) {
    if (prop.type !== 'ObjectProperty') continue;
    const key = prop.key.type === 'Identifier' ? prop.key.name : extractStringValue(prop.key);
    if (!key) continue;

    const val = extractPrimitiveValue(prop.value);
    if (val !== undefined) {
      opts[key] = val;
    }
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

// ---------------------------------------------------------------------------
// Parse functions for class decorators
// ---------------------------------------------------------------------------

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

function parseObjectClassArgs(node) {
  if (node.type !== 'Decorator') return null;
  const expr = node.expression;

  if (expr.type === 'Identifier') return {};

  if (expr.type === 'CallExpression') {
    const args = expr.arguments;
    if (args.length === 0) return {};

    if (args[0].type === 'StringLiteral') {
      return { type: args[0].value };
    }
    if (args[0].type === 'ObjectExpression') {
      return extractObjectOptions(args[0]);
    }
  }

  return null;
}

function parseTraitClassArgs(node) {
  if (node.type !== 'Decorator') return null;
  const expr = node.expression;

  if (expr.type === 'Identifier') return {};

  if (expr.type === 'CallExpression') {
    const args = expr.arguments;
    if (args.length === 0) return {};

    if (args[0].type === 'StringLiteral') {
      const opts = args[1] ? extractObjectOptions(args[1]) : {};
      return { name: args[0].value, mode: opts.mode };
    }
    if (args[0].type === 'ObjectExpression') {
      const opts = extractObjectOptions(args[0]);
      return { mode: opts.mode };
    }
  }

  return null;
}

function parseTraitCompositionArgs(node, importMap) {
  if (node.type !== 'Decorator') return null;
  const expr = node.expression;

  if (expr.type !== 'CallExpression') return null;

  const traits = [];
  for (const arg of expr.arguments) {
    if (arg.type === 'Identifier') {
      traits.push(dasherize(arg.name));
    }
  }
  return traits.length > 0 ? traits : null;
}

// ---------------------------------------------------------------------------
// Parse functions for property decorators
// ---------------------------------------------------------------------------

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

function parseLocalArgs(node) {
  if (node.type !== 'Decorator') return null;
  const expr = node.expression;

  if (expr.type === 'Identifier') return {};
  if (expr.type === 'CallExpression' && expr.arguments.length > 0) {
    const opts = extractObjectOptions(expr.arguments[0]);
    return { defaultValue: opts.defaultValue };
  }
  return null;
}

function parseHashArgs(node) {
  if (node.type !== 'Decorator') return null;
  const expr = node.expression;

  if (expr.type === 'CallExpression' && expr.arguments.length > 0) {
    const opts = extractObjectOptions(expr.arguments[0]);
    return { type: opts.type };
  }
  return null;
}

function parseObjectFieldArgs(node) {
  if (node.type !== 'Decorator') return null;
  const expr = node.expression;

  if (expr.type === 'Identifier') return {};
  if (expr.type === 'CallExpression' && expr.arguments.length > 0) {
    const opts = extractObjectOptions(expr.arguments[0]);
    return { sourceKey: opts.sourceKey, type: opts.type };
  }
  return null;
}

function parseArrayFieldArgs(node) {
  if (node.type !== 'Decorator') return null;
  const expr = node.expression;

  if (expr.type === 'Identifier') return {};
  if (expr.type === 'CallExpression' && expr.arguments.length > 0) {
    const opts = extractObjectOptions(expr.arguments[0]);
    return { sourceKey: opts.sourceKey, type: opts.type };
  }
  return null;
}

function parseDerivedArgs(node) {
  if (node.type !== 'Decorator') return null;
  const expr = node.expression;

  if (expr.type === 'CallExpression' && expr.arguments.length > 0) {
    const opts = extractObjectOptions(expr.arguments[0]);
    return { type: opts.type };
  }
  return null;
}

function parseAliasArgs(node) {
  if (node.type !== 'Decorator') return null;
  const expr = node.expression;

  if (expr.type === 'CallExpression' && expr.arguments.length > 0) {
    const opts = extractObjectOptions(expr.arguments[0]);
    return { kind: opts.kind, name: opts.name, type: opts.type, sourceKey: opts.sourceKey };
  }
  return null;
}

function parseAttributeArgs(node) {
  if (node.type !== 'Decorator') return null;
  const expr = node.expression;

  if (expr.type === 'Identifier') return {};
  if (expr.type === 'CallExpression' && expr.arguments.length > 0) {
    const opts = extractObjectOptions(expr.arguments[0]);
    return { sourceKey: opts.sourceKey, type: opts.type };
  }
  return null;
}

function parseBelongsToArgs(node) {
  if (node.type !== 'Decorator') return null;
  const expr = node.expression;

  if (expr.type === 'CallExpression' && expr.arguments.length > 0) {
    const opts = extractObjectOptions(expr.arguments[0]);
    return {
      type: opts.type,
      inverse: opts.inverse !== undefined ? opts.inverse : null,
      async: opts.async,
      polymorphic: opts.polymorphic,
      as: opts.as,
      sourceKey: opts.sourceKey,
    };
  }
  return null;
}

function parseHasManyArgs(node) {
  if (node.type !== 'Decorator') return null;
  const expr = node.expression;

  if (expr.type === 'CallExpression' && expr.arguments.length > 0) {
    const opts = extractObjectOptions(expr.arguments[0]);
    return {
      type: opts.type,
      inverse: opts.inverse !== undefined ? opts.inverse : null,
      async: opts.async,
      polymorphic: opts.polymorphic,
      as: opts.as,
      sourceKey: opts.sourceKey,
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Schema extraction
// ---------------------------------------------------------------------------

function extractSchemas(source) {
  const ast = parse(source, {
    sourceType: 'module',
    plugins: ['typescript', ['decorators', { decoratorsBeforeExport: true }]],
  });

  const resources = [];
  const objects = [];
  const traits = [];
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

      // Determine which class decorator is applied
      let classKind = null; // 'resource' | 'object' | 'trait'
      let classArgs = null;
      let composedTraits = null;

      for (const dec of node.decorators) {
        const name = decoratorName(dec);
        if (!name) continue;
        const original = importMap[name] ?? name;

        if (original === 'Resource' && !classArgs) {
          classKind = 'resource';
          classArgs = parseResourceArgs(dec);
        } else if (original === 'ObjectSchema' && !classArgs) {
          classKind = 'object';
          classArgs = parseObjectClassArgs(dec);
        } else if (original === 'Trait' && !classArgs) {
          classKind = 'trait';
          classArgs = parseTraitClassArgs(dec);
        } else if (original === 'trait') {
          composedTraits = parseTraitCompositionArgs(dec, importMap);
        }
      }

      if (!classArgs) return;

      const className = node.id?.name;
      const fields = [];
      let identity = null;
      let hashField = null;

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
          if (original === 'local') {
            const opts = parseLocalArgs(dec);
            if (opts) {
              const f = { kind: '@local', name: propName };
              if (opts.defaultValue !== undefined) f.options = { defaultValue: opts.defaultValue };
              fields.push(f);
            }
            break;
          }
          if (original === 'hash') {
            const opts = parseHashArgs(dec);
            if (opts) {
              hashField = { kind: '@hash', name: propName, type: opts.type };
            }
            break;
          }
          if (original === 'object') {
            const opts = parseObjectFieldArgs(dec);
            if (opts) {
              const f = { kind: 'object', name: propName };
              if (opts.type) f.type = opts.type;
              if (opts.sourceKey) f.sourceKey = opts.sourceKey;
              fields.push(f);
            }
            break;
          }
          if (original === 'array') {
            const opts = parseArrayFieldArgs(dec);
            if (opts) {
              const f = { kind: 'array', name: propName };
              if (opts.type) f.type = opts.type;
              if (opts.sourceKey) f.sourceKey = opts.sourceKey;
              fields.push(f);
            }
            break;
          }
          if (original === 'derived') {
            const opts = parseDerivedArgs(dec);
            if (opts) {
              const f = { kind: 'derived', name: propName, type: opts.type };
              fields.push(f);
            }
            break;
          }
          if (original === 'alias') {
            const opts = parseAliasArgs(dec);
            if (opts) {
              const aliasTarget = { kind: opts.kind, name: opts.name };
              if (opts.type) aliasTarget.type = opts.type;
              if (opts.sourceKey) aliasTarget.sourceKey = opts.sourceKey;
              const f = { kind: 'alias', name: propName, type: null, options: aliasTarget };
              fields.push(f);
            }
            break;
          }
          if (original === 'attribute') {
            const opts = parseAttributeArgs(dec);
            if (opts) {
              const f = { kind: 'attribute', name: propName };
              if (opts.type) f.type = opts.type;
              if (opts.sourceKey) f.sourceKey = opts.sourceKey;
              fields.push(f);
            }
            break;
          }
          if (original === 'belongsTo') {
            const opts = parseBelongsToArgs(dec);
            if (opts) {
              const f = { kind: 'belongsTo', name: propName, type: opts.type, options: {} };
              f.options.async = opts.async !== undefined ? opts.async : false;
              f.options.inverse = opts.inverse !== undefined ? opts.inverse : null;
              if (opts.polymorphic) f.options.polymorphic = opts.polymorphic;
              if (opts.as) f.options.as = opts.as;
              if (opts.sourceKey) f.sourceKey = opts.sourceKey;
              fields.push(f);
            }
            break;
          }
          if (original === 'hasMany') {
            const opts = parseHasManyArgs(dec);
            if (opts) {
              const f = { kind: 'hasMany', name: propName, type: opts.type, options: {} };
              f.options.async = opts.async !== undefined ? opts.async : false;
              f.options.inverse = opts.inverse !== undefined ? opts.inverse : null;
              if (opts.polymorphic) f.options.polymorphic = opts.polymorphic;
              if (opts.as) f.options.as = opts.as;
              if (opts.sourceKey) f.sourceKey = opts.sourceKey;
              fields.push(f);
            }
            break;
          }
        }
      }

      if (classKind === 'resource') {
        const type = classArgs.type ?? (className ? dasherize(className) : 'unknown');
        resources.push({
          type,
          isLegacy: classArgs.legacy === true,
          identityField: classArgs.identityField,
          identity,
          fields,
          traits: composedTraits,
        });
      } else if (classKind === 'object') {
        const type = classArgs.type ?? (className ? dasherize(className) : 'unknown');
        objects.push({
          type,
          hashField,
          fields,
        });
      } else if (classKind === 'trait') {
        const name = classArgs.name ?? (className ? dasherize(className) : 'unknown');
        const mode = classArgs.mode ?? 'polaris';
        traits.push({
          name,
          mode,
          fields,
          traits: composedTraits,
        });
      }
    },
  });

  return { resources, objects, traits };
}

// ---------------------------------------------------------------------------
// Schema compilation
// ---------------------------------------------------------------------------

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
  if (info.traits) schema.traits = info.traits;

  return schema;
}

function toObjectSchema(info) {
  const schema = {
    type: info.type,
    identity: info.hashField ?? null,
    fields: info.fields,
  };
  return schema;
}

function toTrait(info) {
  const schema = {
    name: info.name,
    mode: info.mode,
    fields: info.fields,
  };
  if (info.traits) schema.traits = info.traits;
  return schema;
}

// ---------------------------------------------------------------------------
// Vite plugin
// ---------------------------------------------------------------------------

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
      const allResources = [];
      const allObjects = [];
      const allTraits = [];

      for (const file of files) {
        const source = readFileSync(file, 'utf-8');
        const { resources, objects, traits } = extractSchemas(source);

        for (const info of resources) {
          allResources.push(toResourceSchema(info));
        }
        for (const info of objects) {
          allObjects.push(toObjectSchema(info));
        }
        for (const info of traits) {
          allTraits.push(toTrait(info));
        }
      }

      const lines = [];
      lines.push(`export const resources = ${JSON.stringify(allResources, null, 2)};`);
      lines.push(`export const objects = ${JSON.stringify(allObjects, null, 2)};`);
      lines.push(`export const traits = ${JSON.stringify(allTraits, null, 2)};`);
      lines.push(`export default resources;`);
      return lines.join('\n');
    },
  };
}
