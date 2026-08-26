import { defineConfig } from '@rslib/core';

export default defineConfig({
  tools: {
    rspack: {
      resolve: {
        alias: {
          'supports-color': new URL('./src/mocks/supports-color.js', import.meta.url).pathname,
        },
      },
    },
  },
  lib: [
    {
      source: { entry: { index: './src/turboServer.ts' } },
      bundle: true,
      format: 'cjs',
      output: {
        distPath: { root: './dist/turboServer' },
        filename: { js: 'index.js' },
      },
    },
    {
      source: { entry: { index: './src/starter.ts' } },
      bundle: true,
      format: 'cjs',
      output: {
        distPath: { root: './dist/starter' },
        filename: { js: 'index.js' },
      },
    },
    {
      source: { entry: { index: './src/post.ts' } },
      bundle: true,
      format: 'cjs',
      output: {
        distPath: { root: './dist/post' },
        filename: { js: 'index.js' },
      },
    },
  ],
  output: {
    target: 'node',
  },
});
