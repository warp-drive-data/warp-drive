/**
 * `@warp-drive/build-config`'s babel macros (`assert`, deprecation/feature/debug
 * flags) all compile down to `macroCondition(getGlobalConfig()...)` guarding a
 * side-effecting expression, using either an `if` statement or a ternary with
 * an empty-object "else" branch. `@embroider/macros`'s babel plugin (run by a
 * *consuming* app's own build, since these macros are intentionally deferred
 * until final app config is known) only recognizes `macroCondition(...)` as
 * the direct predicate of an `if`/ternary — not a logical `&&`.
 *
 * Rolldown's tree-shaking pass, unlike Rollup's, sometimes rewrites exactly
 * this shape (a discarded-value conditional with a side-effect-free "else")
 * into `cond && sideEffect()`, breaking that later macro expansion. This has
 * proven inconsistent to avoid via `treeshake`/`optimization` config (fully
 * disabling tree-shaking trades this bug for a different one in
 * `rolldown-plugin-dts`'s chunking), so instead this patches the *rendered*
 * chunk text back to an `if` statement — safe because the pattern is narrow
 * (scoped to `macroCondition(getGlobalConfig()...)`, warp-drive's own macro
 * shape) and semantically identical either way.
 */
const MACRO_CONDITION_AND = /\bmacroCondition\(((?:[^()]|\([^()]*\))*)\)(\s*)&&(\s*)/g;

export function FixMacroConditionsPlugin() {
  return {
    name: 'warp-drive:fix-macro-conditions',
    renderChunk(code) {
      if (!code.includes('macroCondition(')) {
        return null;
      }
      const fixed = code.replace(
        MACRO_CONDITION_AND,
        (_match, condition, _ws1, ws2) => `if (macroCondition(${condition}))${ws2}`
      );
      return fixed === code ? null : { code: fixed, map: null };
    },
  };
}
