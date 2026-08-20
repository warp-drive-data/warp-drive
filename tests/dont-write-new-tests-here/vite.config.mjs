import { defineConfig } from 'vite';
import { extensions, classicEmberSupport, ember } from '@embroider/vite';
import { babel } from '@rollup/plugin-babel';

export default defineConfig({
  build: {
    outDir: 'dist-test',
    // @embroider/vite's `ember()` plugin defaults `build.minify` to
    // `'terser'` for production builds unless something else is
    // configured, which would require adding `terser` as a devDependency
    // just for this test app. Use esbuild's (already-bundled, faster)
    // minifier instead - exact minification output doesn't matter here
    // since main-test-app is never published/shipped.
    minify: 'esbuild',
  },
  plugins: [
    classicEmberSupport(),
    ember(),
    // extra plugins here
    babel({
      babelHelpers: 'runtime',
      extensions,
    }),
  ],
});
