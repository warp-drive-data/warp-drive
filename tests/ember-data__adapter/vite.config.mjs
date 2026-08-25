import { defineConfig } from 'vite';
import { extensions, ember } from '@embroider/vite';
import { maybeBabel } from '@warp-drive/internal-config/vite/babel.js';

export default defineConfig({
  build: {
    // @embroider/vite's `ember()` plugin defaults `build.minify` to `'terser'`.
    // These are test-only bundles that are never shipped, so skip minification.
    minify: false,
    rollupOptions: {
      input: { tests: 'index.html' },
    },
  },
  plugins: [ember(), maybeBabel({ extensions })],
});
