import { defineConfig } from 'vite';
import { extensions, classicEmberSupport, ember } from '@embroider/vite';
import { babel } from '@rollup/plugin-babel';

export default defineConfig({
  build: {
    outDir: 'dist-test',
    // @embroider/vite's `ember()` plugin defaults `build.minify` to `'terser'`
    // for production builds. main-test-app is never published/shipped, so skip
    // minification entirely rather than paying for it.
    minify: false,
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
