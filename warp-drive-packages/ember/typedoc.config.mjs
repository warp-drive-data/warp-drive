import { entryPoints } from './tsdown.config.mjs';

/** @type {Partial<import("typedoc").TypeDocOptions>} */
const config = {
  $schema: 'https://typedoc.org/schema.json',
  entryPoints: entryPoints
    .map((v) => v.replace('./src', './dist').replace('.ts', '.d.ts'))
    .filter((entry) => !entry.includes('-private')),
  out: 'doc',
  readme: 'src/index.md',
  tsconfig: './typedoc.tsconfig.json',
};

export default config;
