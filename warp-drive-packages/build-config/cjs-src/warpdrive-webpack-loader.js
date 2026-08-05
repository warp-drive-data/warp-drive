/*
 * A webpack loader that evaluates WarpDrive's build-time macros
 * (see ./transforms/babel-plugin-transform-macros.js) in classic
 * (ember-auto-import) builds, where the app's babel plugins are not
 * applied to bundled packages.
 *
 * Files that do not import the macros module are returned untouched —
 * most package files don't, and re-printing them through babel is both
 * wasteful and risky.
 *
 * Options:
 * - `babelCore`: absolute path to @babel/core
 * - `plugin`: absolute path to the babel plugin
 * - `pluginOptions`: options for the plugin (sources, config, appRoot)
 */
import { createRequire } from 'node:module';

export default function warpdriveLoader(source, inputSourceMap) {
  const options = this.getOptions();
  const sources = options.pluginOptions.sources;

  if (!sources.some((importSource) => source.includes(importSource))) {
    this.callback(null, source, inputSourceMap);
    return;
  }

  const requireFrom = createRequire(import.meta.url);
  const babel = requireFrom(options.babelCore);
  const result = babel.transformSync(source, {
    filename: this.resourcePath,
    configFile: false,
    babelrc: false,
    sourceMaps: this.sourceMap ? true : false,
    inputSourceMap: inputSourceMap || undefined,
    plugins: [[options.plugin, options.pluginOptions, 'warpdrive']],
  });

  this.callback(null, result.code, result.map || undefined);
}
