import { entryPoints } from './tsdown.config.mjs';

/** @type {Partial<import("typedoc").TypeDocOptions>} */
const config = {
  $schema: 'https://typedoc.org/schema.json',
  entryPoints: entryPoints.filter((entry) => !entry.includes('-private')),
  out: 'doc',
  readme: 'src/index.md',
  // build-config.ts re-exports types (e.g. WarpDriveConfig) that are declared
  // in @warp-drive/build-config. The docs-viewer root config sets
  // excludeExternals: true so cross-package re-exports collapse into a link
  // to their origin package instead of getting their own page -- but
  // @warp-drive/core/build-config is the intended public surface for these,
  // so document them here too.
  excludeExternals: false,
};

export default config;
