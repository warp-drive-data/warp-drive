import { entryPoints } from './tsdown.config.mjs';

// Entry points listed under "non-public" in tsdown.config.mjs that do not carry a
// -private segment in their path. They exist for sibling @warp-drive/* packages and
// get no page here.
const nonPublicEntryPoints = ['./src/types/runtime.ts', './src/utils/string.ts'];

/** @type {Partial<import("typedoc").TypeDocOptions>} */
const config = {
  $schema: 'https://typedoc.org/schema.json',
  // -leaked entry points hand internals to sibling @warp-drive/* packages; each
  // sibling documents what it publishes from them, so they get no page here.
  entryPoints: entryPoints.filter(
    (entry) => !entry.includes('-private') && !entry.includes('-leaked') && !nonPublicEntryPoints.includes(entry)
  ),
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
