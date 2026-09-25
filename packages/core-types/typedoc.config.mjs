import { entryPoints } from './tsdown.config.mjs';

// Entry points listed under "non-public" in tsdown.config.mjs that do not carry a
// -private segment in their path. They exist for sibling @warp-drive/* packages and
// get no page here.
const nonPublicEntryPoints = ['./src/runtime.ts'];

/** @type {Partial<import("typedoc").TypeDocOptions>} */
const config = {
  $schema: 'https://typedoc.org/schema.json',
  entryPoints: entryPoints.filter((entry) => !entry.includes('-private') && !nonPublicEntryPoints.includes(entry)),
  out: 'doc',
  readme: 'src/index.md',
};

export default config;
