import { Addon } from '@embroider/addon-dev/rollup';

const addon = new Addon({ srcDir: 'src', destDir: 'addon' });

// a private package only serves the resolver: its missing entry is not reported
export default { plugins: [addon.publicEntrypoints(['index.js', 'missing.js'])] };
