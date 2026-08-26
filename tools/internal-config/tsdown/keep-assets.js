import { join } from 'path';
import { copyFileSync, mkdirSync } from 'fs';
import { globbySync } from 'globby';

export function keepAssets({ from, include, dist }) {
  return {
    name: 'copy-assets',

    // the assets go into the output directory in the same relative locations as
    // in the input directory
    async closeBundle() {
      const files = globbySync(include, { cwd: join(process.cwd(), from) });
      for (let name of files) {
        const fromPath = join(process.cwd(), from, name);
        const toPath = join(process.cwd(), dist, name);

        mkdirSync(join(toPath, '..'), { recursive: true });
        copyFileSync(fromPath, toPath);
      }
    },
  };
}
