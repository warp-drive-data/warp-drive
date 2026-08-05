import { ImportUtil } from 'babel-import-util';

const Utils = new Set(['assert']);

// the build-time macros evaluated by ./babel-plugin-transform-macros.js
// these pass through this transform untouched
const RuntimeMacros = new Set(['macroCondition', 'getConfig', 'dependencySatisfies', 'moduleExists', 'importSync']);

/*
// Before
import { assert } from '@warp-drive/build-config/macros';

assert('foo', true);

// After
(macroCondition(getConfig().env.DEBUG) ? function assert(test) { if (!test) { throw new Error('foo'); } }(true) : {});
*/

// => _macros.getConfig().env.DEBUG
function buildMacroConstDEBUG(types, binding, state, macrosSource) {
  return types.memberExpression(
    types.memberExpression(
      types.callExpression(state.importer.import(binding, macrosSource, 'getConfig'), []),
      types.identifier('env')
    ),
    types.identifier('DEBUG')
  );
}

// => _macros.macroCondition(_macros.getConfig().env.DEBUG)
function buildMacroConditionDEBUG(types, binding, state, macrosSource) {
  return types.callExpression(state.importer.import(binding, macrosSource, 'macroCondition'), [
    buildMacroConstDEBUG(types, binding, state, macrosSource),
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
function buildAssertTernary(types, binding, state, originalCallExpression, macrosSource) {
  return types.expressionStatement(
    types.conditionalExpression(
      buildMacroConditionDEBUG(types, binding, state, macrosSource),
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
            const name = specifier.node.imported.name;
            if (RuntimeMacros.has(name)) {
              // evaluated later by babel-plugin-transform-macros
              return;
            }
            if (!Utils.has(name)) {
              throw new Error(`Unexpected import '${name}' imported from '${importPath}'`);
            }

            const localBindingName = specifier.node.local.name;
            const binding = specifier.scope.getBinding(localBindingName);

            binding.referencePaths.forEach((p) => {
              const originalCallExpression = p.parentPath.node;

              if (!t.isCallExpression(originalCallExpression)) {
                throw new Error('Expected a call expression');
              }

              const assertTernary = buildAssertTernary(t, binding, state, originalCallExpression, importPath);
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
        state.importer = new ImportUtil(t, path);
      },
    },
  };
}
