import path from 'node:path';
import { defineConfig } from 'vitest/config';

const codemodsPkg = path.resolve(import.meta.dirname, '../../packages/codemods');

export default defineConfig({
  resolve: {
    // Resolve @ember-data/codemods to the workspace source rather than the
    // injected copy: these suites import the package's TS source, whose own
    // imports (winston, jscodeshift, ...) are devDependencies (they are bundled
    // into the published CLI) and therefore absent from the injected copy.
    alias: {
      '@ember-data/codemods/schema-migration': path.join(codemodsPkg, 'src/schema-migration'),
      '@ember-data/codemods': path.join(codemodsPkg, 'src/index.ts'),
    },
  },
  test: {
    exclude: ['**/tests/index.spec.ts'],
  },
});
