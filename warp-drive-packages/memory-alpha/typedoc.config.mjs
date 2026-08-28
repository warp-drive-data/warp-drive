/** @type {Partial<import("typedoc").TypeDocOptions>} */
const config = {
  $schema: 'https://typedoc.org/schema.json',
  // this package has no source code, only markdown skills, so its docs
  // page is just the overview readme with no exported members
  entryPoints: [],
  out: 'doc',
  readme: 'skills/overview.md',
};

export default config;
