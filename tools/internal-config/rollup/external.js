import path from 'path';
import fs from 'fs';
import { globbySync } from 'globby';

function loadConfig() {
  const configPath = path.join(process.cwd(), './package.json');
  const pkg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  return pkg;
}

export function entryPoints(globs, resolve, options) {
  const files = [];

  // expand all globs
  globs.forEach((glob) => {
    glob.includes('*') || glob.includes('{') ? files.push(...globbySync(glob)) : files.push(glob);
  });

  const srcDir = fixViteHijack(
    resolve(options.srcDir.startsWith('.') ? options.srcDir : './' + options.srcDir).slice(7) + '/'
  );

  // resolve all files to full paths
  const allFiles = files.map((v) => {
    if (!v.startsWith('.')) {
      v = './' + v;
    }

    const file = fixViteHijack(resolve(v));
    if (file.startsWith('file://')) {
      return file.slice(7);
    }
    return file;
  });

  const fileMap = {};
  allFiles.forEach((file) => {
    let name;
    if (options.flatten) {
      // extract the file name sans directory and extension
      name = path.basename(file, path.extname(file));
    } else {
      // extract the file name sans srcDir directory and extension
      name = file.replace(srcDir, '');
      name = name.slice(0, name.length - path.extname(name).length);
    }
    fileMap[name] = file;
  });
  // console.log({ srcDir, fileMap });
  return fileMap;
}

export function fixViteHijack(filePath) {
  // Vite's config loader rewrites resolved paths through a temp dir; tsdown's
  // config loader (which re-imports the config bypassing Node's module cache
  // to support --watch) instead taints `import.meta.resolve()` output with a
  // `?no-cache=<uuid>` query suffix. Strip both.
  return filePath.replace('/node_modules/.vite-temp/', '/').replace(/\?.*$/, '');
}

export function external(manual = []) {
  const pkg = loadConfig();
  const deps = Object.keys(pkg.dependencies || {});
  const peers = Object.keys(pkg.peerDependencies || {});
  const all = new Set([...deps, ...peers, ...manual]);

  // console.log({ externals: result });
  return function (id) {
    // An explicit (manual) external, or a declared dependency/peerDependency,
    // always wins -- even if it also happens to be a self-referencing
    // subpath of this very package (e.g. `@ember-data/debug` deliberately
    // lists `@ember-data/debug/data-adapter` as external so it stays a bare
    // specifier for the consuming app to resolve, rather than being routed
    // to an internal entry). Check this before the self-reference bypass below.
    if (all.has(id)) {
      return true;
    }

    // A package importing its own name (e.g. `@warp-drive/core` source
    // importing `@warp-drive/core/build-config/env`) is a self-reference, not
    // an external dependency. Under Vite/Rollup this branch is never reached
    // for such ids since Vite's own resolver resolves package self-references
    // to the local entry before Rollup's `external` option is ever consulted.
    // Rolldown/tsdown checks `external`/`deps.neverBundle` first, so without
    // this it would hit the guardrail below; returning `false` here lets
    // resolution proceed so a self-reference-aware resolver plugin can resolve it.
    if (id === pkg.name || id.startsWith(pkg.name + '/')) {
      return false;
    }

    for (const dep of deps) {
      if (id.startsWith(dep + '/')) {
        return true;
      }
    }

    for (const dep of peers) {
      if (id.startsWith(dep + '/')) {
        return true;
      }
    }

    if (id.startsWith('@warp-drive/build-config/') && pkg.devDependencies?.['@warp-drive/build-config']) {
      return true;
    }

    if (id.startsWith('@embroider/macros') && pkg.devDependencies?.['@embroider/macros']) {
      return true;
    }

    if (id.startsWith('expect-type') && pkg.devDependencies?.['expect-type']) {
      return true;
    }

    if (id.startsWith('@ember/') || id.startsWith('@ember-data/') || id.startsWith('@warp-drive/')) {
      throw new Error(`Unexpected import: '${id}' is neither a dependency nor a peerDependency.`);
    }

    return false;
  };
}

export function explicitExternals(manual = []) {
  return function (id) {
    if (manual.includes(id)) {
      return true;
    }
    return false;
  };
}
