/** @type {Partial<import("typedoc").TypeDocOptions>} */
const config = {
  $schema: 'https://typedoc.org/schema.json',
  // this package has no source code, only markdown skills, so its docs
  // page is just a brief intro with no exported members
  entryPoints: [],
  out: 'doc',
  readme: 'api-docs.md',
};

export default config;
