import { defineConfig } from 'vite';
import { extensions, ember } from '@embroider/vite';
import { babel } from '@rollup/plugin-babel';
import { schemaDSL } from '@warp-drive/schema-dsl/vite';

export default defineConfig({
  build: {
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
    babel({
      babelHelpers: 'inline',
      extensions,
    }),
  ],
});
