import { defineConfig } from 'vite';
import { extensions, ember, hbs } from '@embroider/vite';
import { maybeBabel } from '@warp-drive/internal-config/vite/babel.js';

export default defineConfig({
  build: {
    // @embroider/vite's `ember()` plugin defaults `build.minify` to
    // `'terser'` for production builds unless something else is
    // configured, which would require adding `terser` as a devDependency
    // just for this test app. Skip minification entirely instead - exact
    // minification output doesn't matter here since this app is never
    // published/shipped.
    minify: false,
  },
  server: {
    proxy: {
      '/api': 'http://localhost:4701',
    },
  },
  resolve: {
    alias: {
      '@html-next/vertical-collection':
        process.cwd() + '/node_modules/' + '@html-next/vertical-collection/src/components/vertical-collection.gjs',
    },
  },
  plugins: [
    hbs(),
    ember(),
    // extra plugins here
    maybeBabel({ extensions, babelHelpers: 'runtime' }),
  ],
});
