import { ember, extensions } from '@embroider/vite';
import { babel } from '@rollup/plugin-babel';
import { defineConfig } from 'vite';

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
  plugins: [ember(), babel({ babelHelpers: 'runtime', extensions })],
});
