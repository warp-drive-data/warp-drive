import { defineConfig } from 'vite';
import { extensions, ember, hbs } from '@embroider/vite';
import { babel } from '@rollup/plugin-babel';

export default defineConfig({
  build: {
    outDir: 'dist-test',
    sourcemap: false,
    // this app is only ever built for testing (build:tests/build:production),
    // never shipped -- the classic ember-cli-build.js explicitly disabled
    // ember-cli-terser for the equivalent case (EMBER_CLI_TEST_COMMAND &&
    // EMBER_ENV === 'production') for the same reason. Minifying here adds
    // nothing (there's no real bundle-size concern for a test app) and
    // terser's mangling has been observed to break the built app at runtime
    // (e.g. corrupting router/owner state), so skip it entirely.
    minify: false,
  },
  plugins: [
    hbs(),
    ember(),
    // extra plugins here
    babel({
      babelHelpers: 'runtime',
      extensions,
    }),
  ],
});
