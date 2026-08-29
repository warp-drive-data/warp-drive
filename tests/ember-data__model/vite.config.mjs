import { extensions, ember } from '@embroider/vite';
import { defineConfig } from 'vite';

import { maybeBabel } from '@warp-drive/internal-config/vite/babel.js';

export default defineConfig({
  build: {
    rollupOptions: {
      input: { tests: 'index.html' },
    },
  },
  plugins: [ember(), maybeBabel({ extensions })],
});
