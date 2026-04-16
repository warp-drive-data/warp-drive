import { exec } from '../../../utils/cmd.ts';
import { Package } from '../../../utils/package.ts';

function extractValuePath(value: string): string {
  if (!value.startsWith('./dist/')) {
    throw new Error(`Unexpected export path format: ${value}`);
  }
  return value.slice(7);
}

function addUnpkgExportConditions(pkg: Package) {
  const existing = (pkg.pkgData.exports = pkg.pkgData.exports || {});

  /*
   "exports": {
      ".": {
        "types": "./declarations/index.d.ts",
        "default": "./dist/index.js"
      },
      "./*.cjs": {
        "default": "./cjs-dist/*.cjs"
      },
      "./*": {
        "types": "./declarations/*.d.ts",
        "default": "./dist/*.js"
      }
    }
   */
  for (const key of Object.keys(existing)) {
    // ignore .cjs
    if (key.endsWith('.cjs')) {
      continue;
    }

    // copy over the existing entry for default for the group
    const value = existing[key];
    if (typeof value !== 'object' || value === null || !('default' in value) || typeof value.default !== 'string') {
      throw new Error(`Unexpected export format for key ${key} in package ${pkg.pkgData.name}`);
    }

    const newPathValue = extractValuePath(value.default);
    // key order matters here so do not change this without great care.

    /*
      exports = {
        "./": {
          "unpkg-dev-deprecated": "", // dev with deprecations
          "unpkg-dev": "", // dev no deprecations
          "unpkg-deprecated": "", // prod with deprecations
          unpkg: "", // prod no deprecations
          types: "./declarations/index.d.ts",
          default: "./dist/index.js",
        },
     */
    const exports = {} as Record<string, string>;
    exports['unpkg-dev-deprecated'] = `./dist/unpkg/dev-deprecated/${newPathValue}`;
    exports['unpkg-dev'] = `./dist/unpkg/dev/${newPathValue}`;
    exports['unpkg-deprecated'] = `./dist/unpkg/prod-deprecated/${newPathValue}`;
    exports['unpkg'] = `./dist/unpkg/prod/${newPathValue}`;

    const newValue = {
      ...exports,
      ...value,
    };
    existing[key] = newValue;
  }
}

/**
 * Amend the package files for unpkg publishing.
 *
 * This involves adding "unpkg" export conditions to package.json
 * and building the package with various build configurations to
 * support these conditions.
 *
 * Supported configurations:
 * - production, no-deprecations
 * - production, all-deprecations
 * - development, no-deprecations
 * - development, all-deprecations
 *
 * @param pkg The package to amend.
 */
export async function amendFilesForUnpkg(pkg: Package) {
  // add "unpkg" export conditions to package.json
  addUnpkgExportConditions(pkg);
  await pkg.file.write();
  // run a build with the various build-config settings
  // production, no-deprecations
  // production, all-deprecations
  // development, no-deprecations
  // development, all-deprecations

  // execute `vite build` with env vars:
  // NODE_ENV=production EMBER_DATA_FULL_COMPAT=false IS_UNPKG_BUILD=true
  // NODE_ENV=production EMBER_DATA_FULL_COMPAT=true IS_UNPKG_BUILD=true
  // NODE_ENV=development EMBER_DATA_FULL_COMPAT=false IS_UNPKG_BUILD=true
  // NODE_ENV=development EMBER_DATA_FULL_COMPAT=true IS_UNPKG_BUILD=true
  // and output to the appropriate dist/unpkg subdirectory
  try {
    await exec({
      cwd: pkg.projectPath,
      cmd: `pnpm exec vite build --outDir dist/unpkg/prod`,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        EMBER_DATA_FULL_COMPAT: 'true',
        IS_UNPKG_BUILD: 'true',
        BABEL_DISABLE_CACHE: '1',
      },
    });
  } catch (e) {
    console.error(`Error building ${pkg.pkgData.name} for unpkg production without deprecations`);
    throw e;
  }

  try {
    await exec({
      cwd: pkg.projectPath,
      cmd: `pnpm exec vite build --outDir dist/unpkg/prod-deprecated`,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        EMBER_DATA_FULL_COMPAT: 'false',
        IS_UNPKG_BUILD: 'true',
        BABEL_DISABLE_CACHE: '1',
      },
    });
  } catch (e) {
    console.error(`Error building ${pkg.pkgData.name} for unpkg production with deprecations`);
    throw e;
  }

  try {
    await exec({
      cwd: pkg.projectPath,
      cmd: `pnpm exec vite build --outDir dist/unpkg/dev`,
      env: {
        ...process.env,
        NODE_ENV: 'development',
        EMBER_DATA_FULL_COMPAT: 'true',
        IS_UNPKG_BUILD: 'true',
        BABEL_DISABLE_CACHE: '1',
      },
    });
  } catch (e) {
    console.error(`Error building ${pkg.pkgData.name} for unpkg development without deprecations`);
    throw e;
  }

  try {
    await exec({
      cwd: pkg.projectPath,
      cmd: `pnpm exec vite build --outDir dist/unpkg/dev-deprecated`,
      env: {
        ...process.env,
        NODE_ENV: 'development',
        EMBER_DATA_FULL_COMPAT: 'false',
        IS_UNPKG_BUILD: 'true',
        BABEL_DISABLE_CACHE: '1',
      },
    });
  } catch (e) {
    console.error(`Error building ${pkg.pkgData.name} for unpkg development with deprecations`);
    throw e;
  }
}
