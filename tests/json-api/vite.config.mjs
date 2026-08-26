import { defineConfig } from 'vite';
import { extensions, ember } from '@embroider/vite';
import { babel } from '@rollup/plugin-babel';

export default defineConfig({
  build: {
    // @embroider/vite's `ember()` plugin defaults `build.minify` to `'terser'`.
    // These are test-only bundles that are never shipped, so skip minification.
    minify: false,
    rollupOptions: {
      input: { tests: 'index.html' },
    },
  },
  plugins: [ember(), babel({ babelHelpers: 'inline', extensions })],
});
