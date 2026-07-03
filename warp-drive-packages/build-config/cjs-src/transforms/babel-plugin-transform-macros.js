import { ImportUtil } from 'babel-import-util';
import fs from 'fs';
import path from 'path';
import semver from 'semver';

/*
 * This plugin evaluates the build-time macros provided by
 * `@warp-drive/build-config/macros` (and its re-export
 * `@warp-drive/core/build-config/macros`), replacing them with their
 * statically computed results. It is WarpDrive's scoped equivalent of the
 * evaluation performed by `@embroider/macros`.
 *
 * Supported macros:
 *
 * - `macroCondition(<expr>)` used as the test of an `if` statement or ternary:
 *     the expression is statically evaluated and the dead branch is removed.
 * - `getConfig()` returns the finalized WarpDrive config. Member access chains
 *     are resolved statically when possible, otherwise the config is inlined.
 * - `dependencySatisfies(name, range)` becomes a boolean literal based on
 *     whether the dependency is resolvable and its version satisfies the range.
 * - `moduleExists(name)` becomes a boolean literal based on whether the
 *     module's package is resolvable.
 * - `importSync(name)` becomes a reference to a hoisted namespace import.
 *
 * Options:
 *
 * - `sources`: the import sources to treat as the macros module
 * - `config`: the finalized WarpDrive config object
 * - `appRoot` (optional): directory used as a fallback for dependency
 *     resolution. Defaults to `process.cwd()`.
 */

const RUNTIME_MACROS = new Set(['macroCondition', 'getConfig', 'dependencySatisfies', 'moduleExists', 'importSync']);

const PackageCache = new Map();

function readPackage(pkgPath) {
  if (PackageCache.has(pkgPath)) {
    return PackageCache.get(pkgPath);
  }
  let result = null;
  if (fs.existsSync(pkgPath)) {
    try {
      result = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    } catch {
      result = null;
    }
  }
  PackageCache.set(pkgPath, result);
  return result;
}

// the nearest package.json with a name, walking up from basedir
function findOwningPackage(basedir) {
  let dir = basedir;
  for (;;) {
    const pkg = readPackage(path.join(dir, 'package.json'));
    if (pkg && pkg.name) {
      return { pkg, root: dir };
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

// node-resolution-style walk for a package's package.json starting from basedir
function findPackage(name, basedir) {
  let dir = basedir;
  for (;;) {
    const pkg = readPackage(path.join(dir, 'node_modules', name, 'package.json'));
    if (pkg) {
      return pkg;
    }
    // when transpiling monorepo source, the owning package may BE the target
    const selfPkg = readPackage(path.join(dir, 'package.json'));
    if (selfPkg && selfPkg.name === name) {
      return selfPkg;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function fileDirFor(state) {
  const filename = state.file?.opts?.filename;
  return filename ? path.dirname(filename) : state.opts.appRoot || process.cwd();
}

/*
 * Mirrors the semantics of `dependencySatisfies` from @embroider/macros:
 * `true` only when the package that owns the file being transpiled *declares*
 * the dependency (dependencies or peerDependencies; devDependencies too when
 * the owning package is the app itself) AND it resolves to a version that
 * satisfies the range.
 */
function evaluateDependencySatisfies(name, range, state) {
  const owner = findOwningPackage(fileDirFor(state));
  if (!owner) {
    return false;
  }
  const appRoot = state.opts.appRoot || process.cwd();
  const isApp = path.resolve(owner.root) === path.resolve(appRoot);
  const dependencyKeys = isApp
    ? ['dependencies', 'devDependencies', 'peerDependencies']
    : ['dependencies', 'peerDependencies'];
  const declared = dependencyKeys.some((key) => owner.pkg[key] && owner.pkg[key][name]);
  if (!declared) {
    return false;
  }
  const pkg = findPackage(name, owner.root);
  if (!pkg || typeof pkg.version !== 'string') {
    return false;
  }
  return semver.satisfies(pkg.version, range, { includePrerelease: true });
}

// Mirrors `moduleExists` from @embroider/macros: plain resolvability
// from the directory of the file being transpiled.
function evaluateModuleExists(name, state) {
  const parts = name.split('/');
  const pkgName = name.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
  return findPackage(pkgName, fileDirFor(state)) !== null;
}

// returns the macro name (e.g. 'macroCondition') when the given callee path
// references an import of one of our macros, else null
function macroNameFor(calleePath, state) {
  if (!calleePath.isIdentifier()) return null;
  const binding = calleePath.scope.getBinding(calleePath.node.name);
  if (!binding) return null;
  const bindingPath = binding.path;
  if (!bindingPath.isImportSpecifier()) return null;
  const importDeclaration = bindingPath.parentPath;
  if (!importDeclaration.isImportDeclaration()) return null;
  if (!state.opts.sources.includes(importDeclaration.node.source.value)) return null;
  const imported = bindingPath.node.imported;
  const importedName = imported.type === 'Identifier' ? imported.name : imported.value;
  return RUNTIME_MACROS.has(importedName) ? importedName : null;
}

function evaluate(p, state) {
  const node = p.node;
  switch (node.type) {
    case 'BooleanLiteral':
    case 'StringLiteral':
    case 'NumericLiteral':
      return node.value;
    case 'NullLiteral':
      return null;
    case 'Identifier':
      if (node.name === 'undefined' && !p.scope.getBinding('undefined')) {
        return undefined;
      }
      break;
    case 'ParenthesizedExpression':
      return evaluate(p.get('expression'), state);
    case 'UnaryExpression':
      if (node.operator === '!') {
        return !evaluate(p.get('argument'), state);
      }
      break;
    case 'LogicalExpression': {
      const left = evaluate(p.get('left'), state);
      switch (node.operator) {
        case '&&':
          return left ? evaluate(p.get('right'), state) : left;
        case '||':
          return left ? left : evaluate(p.get('right'), state);
        case '??':
          return left ?? evaluate(p.get('right'), state);
      }
      break;
    }
    case 'BinaryExpression': {
      const left = evaluate(p.get('left'), state);
      const right = evaluate(p.get('right'), state);
      switch (node.operator) {
        case '===':
          return left === right;
        case '!==':
          return left !== right;
      }
      break;
    }
    case 'MemberExpression': {
      const obj = evaluate(p.get('object'), state);
      const key = node.computed ? evaluate(p.get('property'), state) : node.property.name;
      return obj == null ? undefined : obj[key];
    }
    case 'CallExpression': {
      const macro = macroNameFor(p.get('callee'), state);
      if (macro === 'getConfig') {
        return state.opts.config;
      }
      if (macro === 'dependencySatisfies') {
        const [name, range] = expectStringArguments(p, 2);
        return evaluateDependencySatisfies(name, range, state);
      }
      if (macro === 'moduleExists') {
        const [name] = expectStringArguments(p, 1);
        return evaluateModuleExists(name, state);
      }
      break;
    }
  }
  throw p.buildCodeFrameError(
    `Unable to statically evaluate this expression within a WarpDrive macroCondition. Only boolean logic, config access via getConfig(), dependencySatisfies() and moduleExists() are supported.`
  );
}

function expectStringArguments(p, count) {
  const args = p.get('arguments');
  if (args.length !== count || args.some((arg) => !arg.isStringLiteral())) {
    throw p.buildCodeFrameError(`Expected exactly ${count} string literal argument(s) to this WarpDrive macro.`);
  }
  return args.map((arg) => arg.node.value);
}

function handleMacroCondition(p, state, t) {
  const args = p.get('arguments');
  if (args.length !== 1) {
    throw p.buildCodeFrameError(`macroCondition expects exactly one argument`);
  }
  const value = Boolean(evaluate(args[0], state));
  const parent = p.parentPath;

  if (parent.isIfStatement() && parent.node.test === p.node) {
    const branch = value ? parent.node.consequent : parent.node.alternate;
    if (branch) {
      parent.replaceWith(branch);
    } else {
      parent.remove();
    }
    return;
  }

  if (parent.isConditionalExpression() && parent.node.test === p.node) {
    parent.replaceWith(value ? parent.node.consequent : parent.node.alternate);
    return;
  }

  throw p.buildCodeFrameError(
    `macroCondition can only be used as the direct condition of an if-statement or ternary expression`
  );
}

function handleGetConfig(p, state, t) {
  // resolve the longest static (non-computed) member access chain
  // so we inline only the accessed value rather than the whole config
  let target = p;
  let value = state.opts.config;
  while (
    target.parentPath.isMemberExpression() &&
    target.parentPath.node.object === target.node &&
    !target.parentPath.node.computed &&
    value != null &&
    typeof value === 'object'
  ) {
    const key = target.parentPath.node.property.name;
    if (!(key in value)) {
      break;
    }
    value = value[key];
    target = target.parentPath;
  }
  target.replaceWith(t.valueToNode(value ?? null));
}

export default function (babel) {
  const { types: t } = babel;

  return {
    name: 'warpdrive',
    visitor: {
      Program: {
        enter(path, state) {
          state.importer = new ImportUtil(t, path);
          if (!state.opts.sources || !state.opts.config) {
            throw new Error(
              `The warpdrive babel plugin requires 'sources' and 'config' options. Use babelPlugin() from @warp-drive/core/build-config to configure it.`
            );
          }
        },
        exit(path, state) {
          // importSync is handled after the main traversal so that calls
          // within branches stripped by macroCondition never hoist imports.
          // The namespace is wrapped in the same esModule-interop expression
          // @embroider/macros uses (a synthetic `default` pointing at the
          // namespace) since consumers rely on that shape.
          path.traverse({
            CallExpression: (p) => {
              if (macroNameFor(p.get('callee'), state) !== 'importSync') return;
              const [name] = expectStringArguments(p, 1);
              const ns = state.importer.import(p, name, '*', 'wdImport');
              p.replaceWith(
                t.conditionalExpression(
                  t.memberExpression(t.cloneNode(ns), t.identifier('__esModule')),
                  t.cloneNode(ns),
                  t.objectExpression([
                    t.objectProperty(t.identifier('default'), t.cloneNode(ns)),
                    t.spreadElement(t.cloneNode(ns)),
                  ])
                )
              );
            },
          });

          // remove now-unused macro imports
          path.scope.crawl();
          for (const stmt of path.get('body')) {
            if (!stmt.isImportDeclaration() || !state.opts.sources.includes(stmt.node.source.value)) {
              continue;
            }
            for (const specifier of stmt.get('specifiers')) {
              if (!specifier.isImportSpecifier()) continue;
              const imported = specifier.node.imported;
              const importedName = imported.type === 'Identifier' ? imported.name : imported.value;
              if (!RUNTIME_MACROS.has(importedName)) continue;
              const binding = path.scope.getBinding(specifier.node.local.name);
              if (!binding || binding.referencePaths.filter((ref) => Boolean(ref.node)).length === 0) {
                specifier.remove();
              }
            }
            if (stmt.node.specifiers.length === 0) {
              stmt.remove();
            }
          }
        },
      },

      CallExpression(p, state) {
        const macro = macroNameFor(p.get('callee'), state);
        if (!macro) return;

        switch (macro) {
          case 'macroCondition':
            handleMacroCondition(p, state, t);
            break;
          case 'getConfig':
            handleGetConfig(p, state, t);
            break;
          case 'dependencySatisfies': {
            const [name, range] = expectStringArguments(p, 2);
            p.replaceWith(t.booleanLiteral(evaluateDependencySatisfies(name, range, state)));
            break;
          }
          case 'moduleExists': {
            const [name] = expectStringArguments(p, 1);
            p.replaceWith(t.booleanLiteral(evaluateModuleExists(name, state)));
            break;
          }
          case 'importSync':
            // handled in Program.exit so that stripped branches never hoist imports
            break;
        }
      },
    },
  };
}
