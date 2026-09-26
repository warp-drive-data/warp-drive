#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';

import { parseModule } from './exports.mjs';

const STAR = '*';

/**
 * @param {{ root: string, packagesDir: string, configName: 'tsdown.config.mjs' | 'vite.config.mjs' }} opts
 * @returns {Promise<{ filePath: string, module: string, export: string, typeOnly: boolean }[]>}
 * @throws when a public package's config declares no entry points the scanner understands
 */
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
    if (entryPointPatterns.length === 0) {
      throw new Error(`${path.relative(root, configPath)} declares no entry points the scanner understands`);
    }

    const concreteFiles = await expandEntryPointPatterns(entryPointPatterns, pkgRoot);

    for (const absFile of concreteFiles) {
      if (!/\.(mjs|cjs|js|ts)$/.test(absFile)) continue;
      if (absFile.includes(`${path.sep}test-support${path.sep}`)) continue;

      const relFromSrc = relativeFromSrc(absFile, pkgRoot);
      if (!relFromSrc) continue;

      const moduleSpecifier = buildModuleSpecifier(pkgJson.name, relFromSrc);

      const { named, stars } = parseModule(absFile);
      const exports = [...named].map(([name, { typeOnly }]) => ({ name, typeOnly }));
      if (stars.length) exports.push({ name: STAR, typeOnly: stars.every((star) => star.typeOnly) });
      for (const exp of exports) {
        records.push({
          filePath: path.relative(root, absFile).replace(/\\/g, '/'),
          module: moduleSpecifier,
          export: exp.name,
          typeOnly: exp.typeOnly,
        });
      }
    }
  }

  return dedupeAndSort(records);
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

function extractEntryPoints(source) {
  const results = [];
  const seen = new Set();
  const add = (val) => {
    if (val.includes('${') || seen.has(val)) return;
    seen.add(val);
    results.push(val);
  };
  const literal = /^['"`]([^'"`]+)['"`]$/;
  const regex =
    /\bentryPoints\s*=\s*\[([\s\S]*?)\]|\bentry\s*:\s*(?:\[([\s\S]*?)\]|\{([\s\S]*?)\}|(['"`][^'"`]+['"`]))/g;

  let match;
  while ((match = regex.exec(source))) {
    if (match[4]) {
      add(match[4].slice(1, -1));
      continue;
    }
    const body = match[1] ?? match[2] ?? match[3] ?? '';
    for (const item of body.split(/[\r\n,]/)) {
      const trimmed = item.trim();
      if (!trimmed || trimmed.startsWith('//')) continue;
      const value = match[3] ? trimmed.slice(trimmed.indexOf(':') + 1).trim() : trimmed;
      const str = literal.exec(value);
      if (str) add(str[1]);
    }
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
