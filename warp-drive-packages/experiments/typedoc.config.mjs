import { entryPoints } from './tsdown.config.mjs';

/** @type {Partial<import("typedoc").TypeDocOptions>} */
const config = {
  $schema: 'https://typedoc.org/schema.json',
  entryFileName: 'index',
  entryPoints: entryPoints.filter((entry) => !entry.includes('-private')),
  out: 'doc',
  readme: 'src/index.md',
  // pagination.ts re-exports the pagination primitives, which are declared in
  // @warp-drive/core but published only from this package while they are
  // experimental. The docs-viewer root config sets excludeExternals: true so
  // cross-package re-exports collapse into a link to their origin package
  // instead of getting their own page -- but @warp-drive/experiments/pagination
  // is the intended public surface for these, so document them here.
  excludeExternals: false,
};

export default config;
