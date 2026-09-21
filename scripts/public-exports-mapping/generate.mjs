#!/usr/bin/env node
/**
 * Lists the exported tokens of every entry point file of every published package under a
 * packages directory, as `{ filePath, module, export, typeOnly, replacement: {} }` records.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { parseArgs } from 'node:util';

const STAR = '*';
const REPO_ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
const LAYOUTS = {
  tsdown: { configName: 'tsdown.config.mjs', packages: 'warp-drive-packages' },
  vite: { configName: 'vite.config.mjs', packages: 'packages' },
};

export async function scan({ root, packagesDir, configName }) {
  const configs = await findConfigs(packagesDir, configName);
  const records = [];

  for (const configPath of configs) {
    const pkgRoot = path.dirname(configPath);
    const pkgJson = await readPackageJson(pkgRoot);
    if (!pkgJson?.name || pkgJson.private) continue;

    const configSource = await safeReadFile(configPath);
    if (!configSource) continue;

    const entryPointPatterns = extractEntryPoints(configSource);
    if (entryPointPatterns.length === 0) continue;

    const concreteFiles = await expandEntryPointPatterns(entryPointPatterns, pkgRoot);

    for (const absFile of concreteFiles) {
      if (!/\.(mjs|cjs|js|ts)$/.test(absFile)) continue;
      if (absFile.includes(`${path.sep}test-support${path.sep}`)) continue;

      const relFromSrc = relativeFromSrc(absFile, pkgRoot);
      if (!relFromSrc) continue;

      const moduleSpecifier = buildModuleSpecifier(pkgJson.name, relFromSrc);

      const source = await safeReadFile(absFile);
      if (!source) continue;

      for (const exp of extractExports(source)) {
        records.push({
          filePath: path.relative(root, absFile).replace(/\\/g, '/'),
          module: moduleSpecifier,
          export: exp.name,
          typeOnly: exp.typeOnly,
          replacement: {},
        });
      }
    }
  }

  return dedupeAndSort(records);
}

async function main() {
  const { values } = parseArgs({
    options: {
      root: { type: 'string', default: REPO_ROOT },
      packages: { type: 'string' },
      config: { type: 'string', default: 'tsdown' },
      out: { type: 'string' },
    },
  });
  const layout = LAYOUTS[values.config];
  if (!layout) throw new Error(`--config must be one of ${Object.keys(LAYOUTS).join(', ')}`);
  if (!values.out) throw new Error('--out <file> is required');

  const root = path.resolve(values.root);
  const packagesDir = path.join(root, values.packages ?? layout.packages);
  const outFile = path.resolve(values.out);

  const records = await scan({ root, packagesDir, configName: layout.configName });
  if (records.length === 0) {
    throw new Error(`Found no exports under ${packagesDir}. Refusing to write an empty mapping to ${outFile}.`);
  }

  await fs.writeFile(outFile, JSON.stringify(records, null, 2) + '\n', 'utf8');
  process.stdout.write(`Generated ${records.length} export records -> ${outFile}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === url.fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('Failed to generate public exports mapping:', err.message);
    process.exit(1);
  });
}

/* ------------------------------------------------------------------------------------------------
 * Discovery
 * ------------------------------------------------------------------------------------------------ */

async function findConfigs(packagesDir, configName) {
  const configs = [];
  async function walk(dir) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        await walk(full);
      } else if (ent.name === configName) {
        configs.push(full);
      }
    }
  }
  await walk(packagesDir);
  return configs;
}

async function readPackageJson(pkgRoot) {
  try {
    const raw = await fs.readFile(path.join(pkgRoot, 'package.json'), 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------------------------------------
 * entryPoints Extraction
 * ------------------------------------------------------------------------------------------------ */

/**
 * Extract array elements from any `entryPoints = [ ... ]` or `export const entryPoints = [ ... ]`
 * occurrences in the vite config. We do a quick regex scan and attempt to parse string literals
 * only (we skip anything interpolated with ${}).
 */
function extractEntryPoints(source) {
  const results = [];
  const seen = new Set();
  const regex = /(?:^|\b)entryPoints\s*=\s*\[([\s\S]*?)\]\s*;?|export\s+const\s+entryPoints\s*=\s*\[([\s\S]*?)\]\s*;?/g;

  let match;
  while ((match = regex.exec(source))) {
    const body = match[1] || match[2] || '';
    // Split crudely on commas/newlines
    body
      .split(/[\r\n,]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((item) => {
        if (item.startsWith('//')) return;
        // Extract raw string literal
        const strMatch = /^['"`]([^'"`]+)['"`]$/.exec(item);
        if (!strMatch) return;
        const val = strMatch[1];
        if (val.includes('${')) return; // skip interpolations
        if (!seen.has(val)) {
          seen.add(val);
          results.push(val);
        }
      });
  }
  return results;
}

/**
 * Expand each entry point pattern into a list of absolute file paths.
 * Supports:
 *   - direct file paths (src/index.ts)
 *   - patterns with * or ** (e.g. ./src/** /*.ts)
 */
async function expandEntryPointPatterns(patterns, pkgRoot) {
  const files = [];
  for (const pattern of patterns) {
    const normalized = normalizeEntryPattern(pattern);
    const absPattern = path.resolve(pkgRoot, normalized);
    const expanded = await expandGlob(absPattern);
    files.push(...expanded);
  }
  return files;
}

/**
 * Normalize patterns of the form './src/foo.ts' or 'src/foo.ts'
 */
function normalizeEntryPattern(pattern) {
  // Ensure no leading './' duplication issues
  return pattern.replace(/^[.][/]/, '');
}

/* ------------------------------------------------------------------------------------------------
 * Glob Expansion (simple)
 * ------------------------------------------------------------------------------------------------ */

async function expandGlob(pattern) {
  // If no wildcard characters, treat as a direct file path
  if (!pattern.includes('*')) {
    try {
      const stat = await fs.stat(pattern);
      if (stat.isFile()) return [pattern];
    } catch {
      return [];
    }
    return [];
  }

  const isAbsolute = path.isAbsolute(pattern);
  const segments = pattern.split(path.sep).filter((seg, i) => !(isAbsolute && i === 0 && seg === ''));

  // segments now excludes the empty first segment for absolute paths

  // Determine fixed base (all leading non-glob segments)
  let baseEnd = 0;
  for (; baseEnd < segments.length; baseEnd++) {
    const seg = segments[baseEnd];
    if (seg === '**' || seg.includes('*')) break;
  }

  const baseSegments = segments.slice(0, baseEnd);
  const globSegments = segments.slice(baseEnd);
  const basePath =
    baseSegments.length === 0
      ? isAbsolute
        ? path.sep
        : '.'
      : (isAbsolute ? path.sep : '') + baseSegments.join(path.sep);

  // Validate base path
  try {
    const st = await fs.stat(basePath || '.');
    if (!st.isDirectory()) {
      return [];
    }
  } catch {
    return [];
  }

  const results = [];

  async function walk(idx, currentPath) {
    if (idx === globSegments.length) {
      results.push(currentPath);
      return;
    }

    const seg = globSegments[idx];

    if (seg === '**') {
      // Zero segments
      await walk(idx + 1, currentPath);
      // Descend
      const children = await safeReadDir(currentPath);
      for (const ent of children) {
        if (ent.isDirectory()) {
          await walk(idx, path.join(currentPath, ent.name));
        }
      }
      return;
    }

    if (seg.includes('*')) {
      const rx = globFragmentToRegex(seg);
      const children = await safeReadDir(currentPath);
      for (const ent of children) {
        if (rx.test(ent.name)) {
          await walk(idx + 1, path.join(currentPath, ent.name));
        }
      }
      return;
    }

    // Plain segment
    const nextPath = path.join(currentPath, seg);
    try {
      const st = await fs.stat(nextPath);
      if (st.isDirectory()) {
        await walk(idx + 1, nextPath);
      } else if (st.isFile() && idx === globSegments.length - 1) {
        results.push(nextPath);
      }
    } catch {
      // ignore
    }
  }

  await walk(0, basePath || '.');

  // Keep only files
  const out = [];
  for (const f of results) {
    try {
      const st = await fs.stat(f);
      if (st.isFile()) out.push(path.resolve(f));
    } catch {
      /* ignore */
    }
  }
  return out;
}

function globFragmentToRegex(fragment) {
  const escaped = fragment
    .split('')
    .map((ch) => {
      if (ch === '*') return '.*';
      return /[\\^$+?.()|[\]{}]/.test(ch) ? '\\' + ch : ch;
    })
    .join('');
  return new RegExp(`^${escaped}$`);
}

async function safeReadDir(dir) {
  try {
    return await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------------------------------------
 * Mapping File Path -> Module Specifier
 * ------------------------------------------------------------------------------------------------ */

function relativeFromSrc(absFile, pkgRoot) {
  const srcDir = path.join(pkgRoot, 'src') + path.sep;
  if (!absFile.startsWith(srcDir)) return null;
  return absFile.slice(srcDir.length).replace(/\\/g, '/');
}

function buildModuleSpecifier(packageName, relFromSrc) {
  // strip extension
  const noExt = relFromSrc.replace(/\.[^.]+$/, '');
  if (noExt === 'index') return packageName;
  return `${packageName}/${noExt}`;
}

/* ------------------------------------------------------------------------------------------------
 * Export Extraction
 * ------------------------------------------------------------------------------------------------ */

/**
 * Extract exported symbol tokens (flat) from a single source file.
 *
 * Recognized:
 *   export default ...
 *   export * from '...'
 *   export { a, b as c, type X, default as Y } from '...'
 *   export { a, b as c, type X }
 *   export class|function|async function|const|let|var|enum Name ...
 *   export interface Name ...
 *   export type Name ...
 */
function extractExports(source) {
  // Strip comments to avoid false positives from documentation examples.
  // Replace removed comment content with spaces to keep rough positional alignment.
  const stripped = source.replace(/\/\*[\s\S]*?\*\//g, (m) => ' '.repeat(m.length)).replace(/(^|[^:])\/\/.*$/gm, '$1');

  const exports = [];
  const add = (name, typeOnly = false) => exports.push({ name, typeOnly });

  // default
  if (/export\s+default\b/.test(stripped)) {
    add('default', false);
  }

  // star re-exports
  if (/export\s+\*\s+from\s+['"][^'"]+['"]/.test(stripped)) {
    add(STAR, false);
  }
  if (/export\s+type\s+\*\s+from\s+['"][^'"]+['"]/.test(stripped)) {
    add(STAR, true);
  }

  // named grouped exports
  {
    const groupRegex = /export\s+\{([^}]+)\}(\s+from\s+['"][^'"]+['"])?/g;
    let m;
    while ((m = groupRegex.exec(stripped))) {
      const body = m[1];
      body
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((item) => {
          let typeOnly = false;
          let token = item;

          if (token.startsWith('type ')) {
            typeOnly = true;
            token = token.slice(5).trim();
          }

          if (/^default\s+as\s+/.test(token)) {
            const target = token.split(/\s+as\s+/)[1];
            if (target) add(target.trim(), false);
            return;
          }

          if (token.includes(' as ')) {
            const [, alias] = token.split(/\s+as\s+/);
            add(alias.trim(), typeOnly);
            return;
          }

          add(token.trim(), typeOnly);
        });
    }
  }

  // declaration exports line-by-line
  const declPatterns = [
    { re: /export\s+(?:abstract\s+)?class\s+([A-Za-z0-9_$]+)/, type: false },
    { re: /export\s+(?:async\s+)?function\s+([A-Za-z0-9_$]+)/, type: false },
    { re: /export\s+const\s+([A-Za-z0-9_$]+)/, type: false },
    { re: /export\s+let\s+([A-Za-z0-9_$]+)/, type: false },
    { re: /export\s+var\s+([A-Za-z0-9_$]+)/, type: false },
    { re: /export\s+enum\s+([A-Za-z0-9_$]+)/, type: false },
    { re: /export\s+interface\s+([A-Za-z0-9_$]+)/, type: true },
    { re: /export\s+type\s+([A-Za-z0-9_$]+)/, type: true },
  ];

  const lines = stripped.split(/\r?\n/);
  for (const line of lines) {
    for (const pat of declPatterns) {
      const mm = pat.re.exec(line);
      if (mm) add(mm[1], pat.type);
    }
  }

  // De-dupe (keeping earliest)
  const seen = new Set();
  return exports.filter((e) => {
    const key = `${e.name}:${e.typeOnly}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* ------------------------------------------------------------------------------------------------
 * Utilities
 * ------------------------------------------------------------------------------------------------ */

async function safeReadFile(file) {
  try {
    return await fs.readFile(file, 'utf8');
  } catch {
    return null;
  }
}

function dedupeAndSort(records) {
  const map = new Map();
  for (const r of records) {
    const key = `${r.module}::${r.export}::${r.typeOnly}`;
    if (!map.has(key)) map.set(key, r);
  }
  const arr = Array.from(map.values());
  const rank = (name) => (name === 'default' ? 0 : name === STAR ? 1 : 2);
  arr.sort((a, b) => {
    if (a.module !== b.module) return a.module < b.module ? -1 : 1;
    const ra = rank(a.export);
    const rb = rank(b.export);
    if (ra !== rb) return ra - rb;
    if (a.export !== b.export) return a.export < b.export ? -1 : 1;
    if (a.typeOnly !== b.typeOnly) return a.typeOnly ? 1 : -1;
    return 0;
  });
  return arr;
}
