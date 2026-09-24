/** @type {Partial<import("typedoc").TypeDocOptions>} */
const config = {
  $schema: 'https://typedoc.org/schema.json',
  entryPoints: ['src/index.js', 'src/recommended.js', 'src/rules/**/*.js'],
  out: 'doc',
  readme: 'src/index.md',
};

export default config;
