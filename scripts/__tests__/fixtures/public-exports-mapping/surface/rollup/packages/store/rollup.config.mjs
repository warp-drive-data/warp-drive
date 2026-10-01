import { Addon } from '@embroider/addon-dev/rollup';

const addon = new Addon({
  srcDir: 'src',
  destDir: 'addon',
});

export default {
  output: addon.output(),
  plugins: [
    // addon.publicEntrypoints(['old.js']),
    addon.publicEntrypoints(['index.js', '-private.js', 'error.js']),
  ],
};
