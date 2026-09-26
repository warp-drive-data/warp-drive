/** @type {Partial<import("typedoc").TypeDocOptions>} */
const config = {
  $schema: 'https://typedoc.org/schema.json',
  entryFileName: 'index',
  // Apps import this package's API from @warp-drive/core/build-config, which
  // re-exports it and documents every member there (see core's
  // typedoc.config.mjs). Documenting the source here too would publish each
  // page twice, so this package renders only its src/index.md landing page,
  // which maps each entry point to its @warp-drive/core/build-config page.
  entryPoints: [],
  out: 'doc',
  readme: 'src/index.md',
};

export default config;
