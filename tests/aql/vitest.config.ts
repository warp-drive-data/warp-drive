import path from 'node:path';
import { defineConfig } from 'vitest/config';

const experimentsPkg = path.resolve(import.meta.dirname, '../../warp-drive-packages/experiments');

export default defineConfig({
  resolve: {
    // Resolve against the workspace source rather than the built dist so tests
    // run without requiring a `build:pkg` pass first.
    alias: {
      '@warp-drive/experiments/aql': path.join(experimentsPkg, 'src/aql.ts'),
    },
  },
});
