import fs from 'fs';
import path from 'path';

import { exec } from '../../../utils/cmd.ts';
import { APPLIED_STRATEGY, Package } from '../../../utils/package.ts';
import { PROJECT_ROOT, TARBALL_DIR, toTarballName } from './generate-tarballs.ts';

const TYPES_SUBDIR = 'unstable-preview-types';

function hasDeclaration(entry: string | Buffer) {
  return String(entry).endsWith('.d.ts');
}

const INVALID_FILES = new Set([
  'src',
  'dist',
  'addon',
  'blueprints',
  'dist/docs',
  'addon-test-support',
  'app',
  'index.js',
  'addon-main.js',
  'addon-main.cjs',
]);

export async function generateTypesTarballs(
  config: Map<string, string | number | boolean | null>,
  packages: Map<string, Package>,
  strategy: Map<string, APPLIED_STRATEGY>
) {
  const tarballDir = path.join(TARBALL_DIR, packages.get('root')!.pkgData.version);
  const tmpDir = path.join(PROJECT_ROOT, 'tmp/types', packages.get('root')!.pkgData.version);
  fs.mkdirSync(tmpDir, { recursive: true });

  // for each public package
  // if that package has types
  // generate a types tarball
  //
  // to do this we
  // copy the types directory to a temporary directory
  // create a new package.json

  for (const [, strat] of strategy) {
    if (!strat.typesPublish || strat.private || strat.types === 'private') {
      continue;
    }

    if (strat.types === 'alpha') {
      const tmpTypesDir = path.join(tmpDir, strat.typesPublishTo);
      fs.mkdirSync(tmpTypesDir, { recursive: true });

      // create a new package.json
      const pkg = packages.get(strat.name)!;
      const pkgData = pkg.pkgData;

      // `makeTypesAlpha` synthesizes this directory and pushes it onto `pkgData.files`,
      // but that push is in-memory only and `restoreTypesStrategyChanges` has since run
      // `git checkout HEAD -- <package.json>` + `pkg.refresh()` for every package, so by
      // the time we get here `pkgData.files` is back to its on-disk state. Before
      // declarations moved into `dist/` the directory was declared in `files` on disk and
      // survived that restore; now it does not, and relying on `files` alone ships a
      // types package containing nothing but a README.
      const sourceFiles = [...(pkgData.files ?? [])];
      if (!sourceFiles.includes(TYPES_SUBDIR)) {
        sourceFiles.push(TYPES_SUBDIR);
      }

      const typesDir = path.join(path.dirname(pkg.filePath), TYPES_SUBDIR);
      if (!fs.existsSync(typesDir) || !fs.readdirSync(typesDir, { recursive: true }).some(hasDeclaration)) {
        throw new Error(
          `Expected ${pkgData.name} to have a populated ${TYPES_SUBDIR} directory to publish as ` +
            `${strat.typesPublishTo}, but it is missing or contains no .d.ts files. It is synthesized by ` +
            `makeTypesAlpha during tarball generation — check that step ran for this package.`
        );
      }

      const newPkgData = {
        name: strat.typesPublishTo,
        version: pkgData.version,
        files: sourceFiles.filter((f) => !INVALID_FILES.has(f)),
        private: false,
        description: `Type Declarations for ${pkgData.name}`,
        author: pkgData.author,
        license: pkgData.license,
        repository: pkgData.repository,
        // try without any peers first
        // peerDependencies: pkgData.peerDependencies,
        // peerDependenciesMeta: pkgData.peerDependenciesMeta,
      };
      const newPkgJson = path.join(tmpTypesDir, 'package.json');
      fs.writeFileSync(newPkgJson, JSON.stringify(newPkgData, null, 2));

      // copy files that are needed
      for (const file of sourceFiles) {
        const src = path.join(path.dirname(pkg.filePath), file);
        const dest = path.join(tmpTypesDir, file);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        await exec(`cp -r ${src} ${dest}`);
      }

      // create the tarball
      const tarballName = toTarballName(strat.typesPublishTo);
      const tarballPath = path.join(tarballDir, `${tarballName}-${pkg.pkgData.version}.tgz`);
      // pack the new package and put it in the tarballs directory
      const result = await exec({
        cwd: tmpTypesDir,
        cmd: `pnpm pack --pack-gzip-level=9 --pack-destination=${tarballDir}`,
        condense: false,
      });
      console.log(result);

      // update the package with the tarball path
      pkg.typesTarballPath = tarballPath;
    } else {
      throw new Error(`Oops! Time to upgrade tis script to handled types strategy: ${strat.types}`);
    }
  }
}
