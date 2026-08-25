import { babel } from '@rollup/plugin-babel';

/**
 * If a file imports any of these, it needs babel even when it otherwise
 * wouldn't be reached (e.g. a published `@warp-drive`/`@ember-data` package
 * sitting in `node_modules`) -- these are all macro/template markers that
 * `@embroider/macros` and Ember's template compilation leave unstripped in
 * published dist output by design, on the assumption that the consuming
 * app's own babel pass is what expands them.
 */
const babelRequiredImports = [
  '@ember/template-compiler',
  '@ember/template-compilation',
  'ember-cli-htmlbars',
  'ember-cli-htmlbars-inline-precompile',
  'htmlbars-inline-precompile',
  '@embroider/macros',
  '@glimmer/env',
  '@ember/debug',
  '@ember/application/deprecations',
];

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const nodeModulesPattern = /\/node_modules\//;

function buildExtensionRegExp(extensions) {
  return new RegExp(
    `(${extensions
      .filter((ext) => ext !== '.json')
      .map(escapeRegExp)
      .join('|')})(\\?.*)?(#.*)?$`
  );
}

/**
 * Wraps `@rollup/plugin-babel` -- run, in our Vite 8 apps, under Rolldown's
 * Rollup-compat plugin bridge -- with our own include check, so babel also
 * reaches `node_modules` files that import one of the markers above.
 *
 * Originally adapted from https://github.com/embroider-build/embroider/pull/2781,
 * which sets this check via a `plugin.transform.filter` property (using
 * `@rolldown/pluginutils`' filter-expression builders) instead of wrapping
 * the function. That relies on Rolldown's Rollup-compat bridge reading a
 * `.filter` property off a plain function-shaped `transform` hook -- which,
 * at least as of `rolldown@1.2.3`/`vite@8.2.1`, it silently doesn't: babel
 * ends up invoked for every file regardless of the filter (observed
 * concretely as `@rollup/plugin-babel` running over an unrelated 500kb+
 * `node_modules` bundle). Wrapping the hook ourselves doesn't depend on
 * whether Rolldown's bridge honors that property.
 *
 * It also drops PR #2781's decorator-content check for gating whether a
 * *local* (non-`node_modules`) file gets babel at all -- that assumes every
 * local file needing babel already contains a decorator, which holds for an
 * Ember app leaning on native oxc/esbuild for TS/JSX and using babel only as
 * a decorator-transform top-up, but not for an app like ours that disables
 * `esbuild` entirely and relies on babel to strip TS/JSX for every file:
 * plain `.tsx` files with no decorators were silently skipped, shipping
 * unstripped TS/JSX to the browser. Local files always get babel here;
 * only the `node_modules` reach-through is gated on the markers above.
 *
 * `extensions` is required -- pass `@embroider/vite`'s `extensions` export
 * (covers `.gjs`/`.gts`) for Ember apps, or a framework-specific list for
 * non-Ember apps (e.g. `['.js', '.ts', '.jsx', '.tsx']`). It's not defaulted
 * here because importing `@embroider/vite` at all pulls in its resolver,
 * which hard-requires `@embroider/core` -- a dependency non-Ember apps
 * (React/Vue/Svelte) don't have.
 */
export function maybeBabel(userOptions) {
  const { filter, extensions, ...options } = userOptions;
  const extensionRegExp = buildExtensionRegExp(extensions);

  const plugin = babel({
    babelHelpers: 'inline',
    extensions,
    skipPreflightCheck: true,
    ...options,
  });

  const importsRegex = new RegExp(
    babelRequiredImports
      .concat(filter?.include?.imports ?? [])
      .map(escapeRegExp)
      .join('|')
  );
  const extraCodePatterns = (filter?.include?.code ?? []).map((pattern) =>
    pattern instanceof RegExp ? pattern : new RegExp(escapeRegExp(pattern))
  );

  function shouldTransform(sourceCode, id) {
    if (!extensionRegExp.test(id)) return false;
    if (!nodeModulesPattern.test(id)) return true;
    if (id.endsWith('.gts') || id.endsWith('.gjs')) return true;
    if (importsRegex.test(sourceCode)) return true;
    return extraCodePatterns.some((pattern) => pattern.test(sourceCode));
  }

  const originalTransform = plugin.transform;
  plugin.transform = function wrappedTransform(sourceCode, id) {
    if (!shouldTransform(sourceCode, id)) return null;
    return originalTransform.call(this, sourceCode, id);
  };

  return { ...plugin, enforce: 'pre', name: 'warp-drive:maybe-babel' };
}
