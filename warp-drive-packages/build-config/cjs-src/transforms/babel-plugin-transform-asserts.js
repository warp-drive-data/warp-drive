import { ImportUtil } from 'babel-import-util';

const Utils = new Set(['assert']);

/*
// Before
import { assert } from '@warp-drive/build-config/macros';

assert('foo', true);

// After
(macroCondition(isDevelopingApp()) ? function assert(test) { if (!test) { throw new Error('foo'); } }(true) : {});
*/

// => _macros.getGlobalConfig().WarpDrive.env.DEBUG
function buildMacroConstDEBUG(types, target, state) {
  return types.memberExpression(
    types.memberExpression(
      types.memberExpression(
        types.callExpression(state.importer.import(target, '@embroider/macros', 'getGlobalConfig'), []),
        types.identifier('WarpDrive')
      ),
      types.identifier('env')
    ),
    types.identifier('DEBUG')
  );
}

// => _macros.macroCondition(_macros.getGlobalConfig().WarpDrive.env.DEBUG)
function buildMacroConditionDEBUG(types, target, state) {
  return types.callExpression(state.importer.import(target, '@embroider/macros', 'macroCondition'), [
    buildMacroConstDEBUG(types, target, state),
  ]);
}

// (test) => { if (!test) { throw new Error(someMessage); } }(someCond)
function buildAssert(types, originalCallExpression) {
  const desc = originalCallExpression.arguments[0];
  const test = originalCallExpression.arguments[1] ?? types.booleanLiteral(false);
  // prettier-ignore
  return types.callExpression(
    types.arrowFunctionExpression([types.identifier('test')],         // (test) =>
      types.blockStatement([                                          // {
        types.ifStatement(                                            // if
          types.unaryExpression('!', types.identifier('test')),       // (!test)
          types.blockStatement([                                      // {
            types.throwStatement(                                     // throw
              types.newExpression(types.identifier('Error'), [desc])  // new Error(desc)
            )])                                                       // }
          )])                                                         // }
        ),
    [test]                                                            // (someCond)
  );
}

// => ( <debug-macro> ? <assert-exp> : {});
function buildAssertTernary(types, target, state, originalCallExpression) {
  return types.expressionStatement(
    types.conditionalExpression(
      buildMacroConditionDEBUG(types, target, state),
      buildAssert(types, originalCallExpression),
      types.objectExpression([])
    )
  );
}

export default function (babel) {
  const { types: t } = babel;

  return {
    name: 'ast-transform', // not required
    visitor: {
      ImportDeclaration(path, state) {
        const importPath = path.node.source.value;

        if (state.opts.sources.includes(importPath)) {
          const specifiers = path.get('specifiers');

          specifiers.forEach((specifier) => {
            // Rolldown emits a defensive `import * as X from '...'` fallback
            // alongside a literal `export * from '...'` re-export (to cover
            // cases where the target's exports aren't statically known). A
            // namespace (or default) specifier isn't one of our named imports,
            // so there's nothing to transform -- skip it.
            if (!specifier.isImportSpecifier()) {
              return;
            }
            const name = specifier.node.imported.name;
            if (!Utils.has(name)) {
              throw new Error(`Unexpected import '${name}' imported from '${importPath}'`);
            }

            const localBindingName = specifier.node.local.name;
            const binding = specifier.scope.getBinding(localBindingName);

            // A binding that's re-exported (`export { assert }`) is a pass-through,
            // not a call site -- there's nothing to expand at its export-specifier
            // reference (and it isn't a CallExpression, so the check below would
            // throw). Leave it untouched; the re-export defers this to wherever
            // it's finally called.
            if (binding.referencePaths.some((p) => p.parentPath.isExportSpecifier())) {
              return;
            }

            binding.referencePaths.forEach((p) => {
              const originalCallExpression = p.parentPath.node;

              if (!t.isCallExpression(originalCallExpression)) {
                throw new Error('Expected a call expression');
              }

              const assertTernary = buildAssertTernary(t, p, state, originalCallExpression);
              p.parentPath.replaceWith(assertTernary);
            });
            specifier.scope.removeOwnBinding(localBindingName);
            specifier.remove();
          });

          if (path.get('specifiers').length === 0) {
            path.remove();
          }
        }
      },

      Program(path, state) {
        state.importer = new ImportUtil(babel, path);
      },
    },
  };
}
