import { createConfig } from '@warp-drive/internal-config/tsdown/config.js';

export const externals = ['@embroider/macros'];

export const entryPoints = [
  './src/index.ts',
  './src/string.ts',
  './src/handlers.ts',
  './src/-private.ts',
  './src/json-api.ts',
  './src/active-record.ts',
  './src/rest.ts',
  './src/derivations.ts',
  './src/streaming.ts',
];

export default createConfig(
  {
    entryPoints,
    externals,
    compileTypes: process.env.IS_UNPKG_BUILD !== 'true',
  },
  import.meta.resolve
);
