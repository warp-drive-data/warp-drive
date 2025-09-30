#!/usr/bin/env node
/**
 * generate-public-exports-mapping.mjs
 *
 * Purpose:
 *   Produce a JSON array describing the exported tokens for ONLY the files explicitly
 *   listed (or matched via glob patterns) in each package's `entryPoints` array found
 *   in `packages/* /vite.config.mjs`.
 *
 *   We DO NOT traverse any other files; we do NOT follow transitive re-exports other
 *   than recording the re-export statement itself (example: export * from '...' is
 *   treated as a single "*" export token for that module). This aligns with:
 *
 *     "only look for exports from files inside of `entryPoints`"
 *
 * Output:
 *   Writes (overwrites) `data/public-exports-mapping.json` with an array of objects:
 *     {
 *       "filePath": "<relative path from repo root to source file>",
 *       "module": "<packageName or packageName/subpath>",
 *       "export": "default" | "*" | "<identifier>",
 *       "isTypeExport": boolean,
 *       "replacement": {}
 *     }
 *
 * Rules:
 *   - A module specifier corresponds exactly to an entry point file:
 *       * If the file's relative path (from src/) is `index.(js|ts|mjs|cjs)` then
 *         the module is the bare package name (e.g. "@ember-data/store").
 *       * Otherwise the module is "@ember-data/store/<relative-no-extension>".
 *   - Exclude any package whose directory name starts with `unpublished`.
 *   - Skip any matched file path containing `/test-support/`.
 *   - Only scan files that were reached via the entryPoints expansion (no extras).
 *   - No attempt to interpret package.json "exports" field; we ONLY trust vite configs.
 *
 * Limitations:
 *   - Uses Babel’s parser; extremely unusual syntax may still fail to parse.
 *   - Does not resolve star exports into concrete names.
 *
 * Node Version: >= 18 (per repository engines)
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import * as t from '@babel/types';

const traverse = typeof traverseModule === 'function' ? traverseModule : traverseModule.default;

const PARSER_PLUGINS = [
  'typescript',
  'decorators-legacy',
  'classProperties',
  'classPrivateProperties',
  'classPrivateMethods',
  'jsx',
  'dynamicImport',
  'exportDefaultFrom',
  'exportNamespaceFrom',
  'topLevelAwait',
];

const REPO_ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..'); // data/
const PACKAGES_DIR = path.join(REPO_ROOT, 'packages');
// const PACKAGES_DIR = path.join(REPO_ROOT, 'warp-drive-packages');
const OUTPUT_FILE = path.join(REPO_ROOT, 'public-exports-mapping-5.5.json');
// const OUTPUT_FILE = path.join(REPO_ROOT, 'public-exports-mapping-main.json');
// const OUTPUT_FILE = path.join(REPO_ROOT, 'public-exports-mapping-wd.json');

const STAR = '*';

/**
 * Entry point
 */
(async function main() {
  try {
    const viteConfigs = await findViteConfigs();
    const allRecords = [];

    for (const configPath of viteConfigs) {
      const pkgRoot = path.dirname(configPath);
      const pkgDirName = path.basename(pkgRoot);

      const pkgJson = await readPackageJson(pkgRoot);

      if (!pkgJson?.name) continue;
      if (pkgJson?.private) continue;

      const packageName = pkgJson.name;

      const viteSource = await safeReadFile(configPath);
      if (!viteSource) continue;

      const entryPointPatterns = extractEntryPoints(viteSource);
      if (entryPointPatterns.length === 0) continue;

      // Resolve each entry point pattern relative to the package root
      const concreteFiles = await expandEntryPointPatterns(entryPointPatterns, pkgRoot);

      for (const absFile of concreteFiles) {
        if (!/\.(mjs|cjs|js|ts)$/.test(absFile)) continue;
        if (absFile.includes(`${path.sep}test-support${path.sep}`)) continue; // skip test-support

        const relFromSrc = relativeFromSrc(absFile, pkgRoot);
        if (!relFromSrc) continue; // must be inside src/

        const moduleSpecifier = buildModuleSpecifier(packageName, relFromSrc);

        const source = await safeReadFile(absFile);
        if (!source) continue;

        const exports = extractExports(source);

        for (const exp of exports) {
          allRecords.push({
            filePath: path.relative(REPO_ROOT, absFile).replace(/\\/g, '/'),
            module: moduleSpecifier,
            export: exp.name,
            isTypeExport: exp.isTypeExport,
            replacement: {},
          });
        }
      }
    }

    const final = dedupeAndSort(allRecords);

    await fs.writeFile(OUTPUT_FILE, JSON.stringify(final, null, 2) + '\n', 'utf8');
    process.stdout.write(`Generated ${final.length} export records -> ${path.relative(REPO_ROOT, OUTPUT_FILE)}\n`);
  } catch (err) {
    console.error('Failed to generate public exports mapping:', err);
    process.exit(1);
  }
})();

/* ------------------------------------------------------------------------------------------------
 * Discovery
 * ------------------------------------------------------------------------------------------------ */

async function findViteConfigs() {
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
      } else if (ent.name === 'vite.config.mjs') {
        configs.push(full);
      }
    }
  }
  await walk(PACKAGES_DIR);
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
  const ast = parse(source, { sourceType: 'module', plugins: PARSER_PLUGINS });
  const seen = new Map();

  const add = (name, isTypeExport = false) => {
    const key = `${name}:${isTypeExport}`;
    if (!seen.has(key)) {
      seen.set(key, { name, isTypeExport });
    }
  };

  const recordFromDeclaration = (declaration, forcedType = false) => {
    const addId = (identifier, isType) => {
      if (identifier) add(identifier, forcedType || isType);
    };

    switch (declaration.type) {
      case 'FunctionDeclaration':
      case 'ClassDeclaration':
      case 'TSDeclareFunction':
        addId(declaration.id?.name, declaration.declare === true);
        break;
      case 'VariableDeclaration':
        for (const declarator of declaration.declarations) {
          collectPatternIds(declarator.id, (idName) => add(idName, forcedType || declaration.declare === true));
        }
        break;
      case 'TSTypeAliasDeclaration':
      case 'TSInterfaceDeclaration':
        add(declaration.id?.name, true);
        break;
      case 'TSEnumDeclaration':
        add(declaration.id?.name, forcedType || declaration.declare === true);
        break;
      case 'TSModuleDeclaration':
        if (t.isIdentifier(declaration.id)) {
          add(declaration.id.name, forcedType || declaration.declare === true);
        }
        break;
      default:
        break;
    }
  };

  traverse(ast, {
    ExportDefaultDeclaration() {
      add('default', false);
    },
    ExportAllDeclaration(path) {
      const { node } = path;
      if (node.exported) {
        const exportedName = getExportedName(node.exported);
        add(exportedName, node.exportKind === 'type');
      } else {
        add(STAR, node.exportKind === 'type');
      }
    },
    ExportNamedDeclaration(path) {
      const { node } = path;
      const forcedType = node.exportKind === 'type';

      if (node.declaration) {
        recordFromDeclaration(node.declaration, forcedType);
      }

      for (const spec of node.specifiers) {
        if (spec.type === 'ExportSpecifier') {
          const exportedName = getExportedName(spec.exported);
          const isType = forcedType || spec.exportKind === 'type';
          add(exportedName, isType);
          if (node.source) {
            const localName = getExportedName(spec.local);
            if (localName) add(localName, isType);
          }
        } else if (spec.type === 'ExportNamespaceSpecifier') {
          const exportedName = getExportedName(spec.exported) ?? STAR;
          add(exportedName, forcedType);
        }
      }
    },
  });

  return Array.from(seen.values());
}

function collectPatternIds(node, visit) {
  if (!node) return;
  if (t.isIdentifier(node)) {
    visit(node.name);
    return;
  }
  if (t.isObjectPattern(node)) {
    for (const prop of node.properties) {
      if (t.isRestElement(prop)) {
        collectPatternIds(prop.argument, visit);
      } else if (t.isObjectProperty(prop)) {
        collectPatternIds(prop.value, visit);
      }
    }
    return;
  }
  if (t.isArrayPattern(node)) {
    for (const elem of node.elements) {
      collectPatternIds(elem, visit);
    }
    return;
  }
  if (t.isAssignmentPattern(node)) {
    collectPatternIds(node.left, visit);
    return;
  }
  if (t.isRestElement(node)) {
    collectPatternIds(prop.argument, visit);
    return;
  }
  if (typeof t.isTSParameterProperty === 'function' && t.isTSParameterProperty(node)) {
    collectPatternIds(node.parameter, visit);
  }
}

function getExportedName(node) {
  if (!node) return null;
  if (t.isIdentifier(node)) return node.name;
  if (t.isStringLiteral(node)) return node.value;
  return null;
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
    const key = `${r.module}::${r.export}::${r.isTypeExport}`;
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
    if (a.isTypeExport !== b.isTypeExport) return a.isTypeExport ? 1 : -1;
    return 0;
  });
  return arr;
}

// End of generate-public-exports-mapping.mjs
