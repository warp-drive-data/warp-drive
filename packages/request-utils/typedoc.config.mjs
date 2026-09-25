import { entryPoints } from './tsdown.config.mjs';

// deprecation-support is a side-effect-only module with no exports, so its page
// would render empty.
const nonPublicEntryPoints = ['src/deprecation-support.ts'];

/** @type {Partial<import("typedoc").TypeDocOptions>} */
const config = {
  $schema: 'https://typedoc.org/schema.json',
  entryFileName: 'index',
  entryPoints: entryPoints.filter((entry) => !entry.includes('-private') && !nonPublicEntryPoints.includes(entry)),
  out: 'doc',
  readme: 'src/index.md',
};

export default config;
