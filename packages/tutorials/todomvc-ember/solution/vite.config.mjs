import { ember, extensions } from '@embroider/vite';
import { babel } from '@rollup/plugin-babel';
import { defineConfig } from 'vite';

import { apiWorker } from './api-worker/vite-plugin.ts';

export default defineConfig({
  build: {
    minify: false,
    rollupOptions: {
      input: {
        main: 'index.html',
        tests: 'tests/index.html',
      },
    },
  },
  plugins: [apiWorker(), ember(), babel({ babelHelpers: 'runtime', extensions })],
});
