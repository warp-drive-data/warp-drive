import { entryPoints } from './tsdown.config.mjs';

// Entry points that would render an empty page and so get none here:
// - types/runtime and utils/string are listed under "non-public" in
//   tsdown.config.mjs without a -private segment in their path; they exist for
//   sibling @warp-drive/* packages.
// - build-config/env and build-config/macros re-export modules that
//   @warp-drive/build-config marks @hidden with every member @private, so
//   TypeDoc drops all of their members and only an empty shell would remain.
const nonPublicEntryPoints = [
  './src/types/runtime.ts',
  './src/utils/string.ts',
  './src/build-config/env.ts',
  './src/build-config/macros.ts',
];

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
