import { ImportUtil } from 'babel-import-util';

const Utils = new Set(['assert']);

/*
// Before
import { assert } from '@warp-drive/build-config/macros';

assert('foo', true);

// After
if (macroCondition(isDevelopingApp())) function assert(test) { if (!test) { throw new Error('foo'); } }(true);
*/

// => _macros.getGlobalConfig().WarpDrive.env.DEBUG
function buildMacroConstDEBUG(types, binding, state) {
  return types.memberExpression(
    types.memberExpression(
      types.memberExpression(
        types.callExpression(state.importer.import(binding, '@embroider/macros', 'getGlobalConfig'), []),
        types.identifier('WarpDrive')
      ),
      types.identifier('env')
    ),
    types.identifier('DEBUG')
  );
}

// => _macros.macroCondition(_macros.getGlobalConfig().WarpDrive.env.DEBUG)
function buildMacroConditionDEBUG(types, binding, state) {
  return types.callExpression(state.importer.import(binding, '@embroider/macros', 'macroCondition'), [
    buildMacroConstDEBUG(types, binding, state),
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

// => if (<debug-macro>) <assert-exp>;
//
// A ternary with an empty-object "else" branch (`<debug-macro> ? <assert-exp> : {}`)
// is semantically equivalent, and was used previously, but bundlers that
// perform tree-shaking/DCE-driven syntax simplification (e.g. rolldown) may
// rewrite that shape into `<debug-macro> && <assert-exp>` when the result is
// discarded. `@embroider/macros`'s babel plugin only recognizes
// `macroCondition(...)` as the direct predicate of an `if` statement or a
// ternary, not a logical `&&`, so such a rewrite breaks macro-expansion in a
// later (consuming) build pass. An `if` statement with no `else` isn't a
// candidate for that rewrite, so it survives such passes unchanged.
function buildAssertIf(types, binding, state, originalCallExpression) {
  return types.ifStatement(
    buildMacroConditionDEBUG(types, binding, state),
    types.expressionStatement(buildAssert(types, originalCallExpression))
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

              const assertIf = buildAssertIf(t, binding, state, originalCallExpression);
              p.parentPath.replaceWith(assertIf);
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
