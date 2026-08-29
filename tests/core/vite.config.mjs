import { extensions, ember } from '@embroider/vite';
import { defineConfig } from 'vite';

import { maybeBabel } from '@warp-drive/internal-config/vite/babel.js';
import { schemaDSL } from '@warp-drive/schema-dsl/vite';

export default defineConfig({
  build: {
    // @embroider/vite's `ember()` plugin defaults `build.minify` to `'terser'`.
    // These are test-only bundles that are never shipped, so skip minification.
    minify: false,
    rollupOptions: {
      input: {
        tests: 'index.html',
      },
    },
  },
  plugins: [
    schemaDSL({
      schemas: 'tests/schema-dsl/schemas/**/*.ts',
    }),
    ember(),
    maybeBabel({ extensions }),
  ],
});
