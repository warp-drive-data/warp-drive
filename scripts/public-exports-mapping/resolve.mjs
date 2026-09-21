#!/usr/bin/env node
/**
 * Writes `packages/eslint-plugin-warp-drive/src/legacy-import-mapping.json`, or with `--check`
 * fails when that file differs from a fresh run. See README.md.
 */

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import ts from 'typescript';

import { scan } from './generate.mjs';

const DIR = path.dirname(url.fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(DIR, '..', '..');
const SNAPSHOT = path.join(DIR, 'public-exports-mapping-5.5.json');
const SHIPPED = path.join(REPO_ROOT, 'packages/eslint-plugin-warp-drive/src/legacy-import-mapping.json');
const MAX_DEPTH = 8;
const LOCAL = { kind: 'local' };
const LOST = { kind: 'lost' };

/**
 * @typedef {{ filePath: string, module: string, export: string, typeOnly: boolean }} ExportRecord
 * @typedef {Map<string, { filePath: string, exports: Map<string, boolean> }>} ScanIndex module -> file and exports (name -> typeOnly)
 * @typedef {{ kind: 'reexport', module: string, name: string, typeOnly: boolean } | { kind: 'local' }} ShimSource
 * @typedef {{ explicit: Map<string, ShimSource>, stars: { module: string, typeOnly: boolean }[] }} ShimFile
 * @typedef {{ kind: 'rule', replacement: { module: string, export: string, typeOnly: boolean } } | { kind: 'local' } | { kind: 'lost' }} Outcome
 */

/** @returns {ScanIndex} */
function indexScan(/** @type {ExportRecord[]} */ records) {
  const index = new Map();
  for (const record of records) {
    let entry = index.get(record.module);
    if (!entry) {
      entry = { filePath: path.join(REPO_ROOT, record.filePath), exports: new Map() };
      index.set(record.module, entry);
    }
    const typeOnly = entry.exports.get(record.export) ?? true;
    entry.exports.set(record.export, typeOnly && record.typeOnly);
  }
  return index;
}

/** @returns {ShimFile} */
function analyzeShim(/** @type {string} */ filePath) {
  const source = ts.createSourceFile(filePath, readFileSync(filePath, 'utf8'), ts.ScriptTarget.Latest, true);
  const imports = new Map();
  const explicit = new Map();
  const stars = [];

  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement) && statement.importClause) {
      const { importClause } = statement;
      const module = statement.moduleSpecifier.text;
      const typeOnly = importClause.isTypeOnly;
      if (importClause.name) {
        imports.set(importClause.name.text, { kind: 'reexport', module, name: 'default', typeOnly });
      }
      if (importClause.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
        for (const element of importClause.namedBindings.elements) {
          const name = (element.propertyName ?? element.name).text;
          imports.set(element.name.text, { kind: 'reexport', module, name, typeOnly: typeOnly || element.isTypeOnly });
        }
      }
    } else if (ts.isExportDeclaration(statement)) {
      const module = statement.moduleSpecifier?.text;
      const typeOnly = statement.isTypeOnly;
      if (!statement.exportClause) {
        stars.push({ module, typeOnly });
      } else if (ts.isNamespaceExport(statement.exportClause)) {
        explicit.set(statement.exportClause.name.text, LOCAL);
      } else {
        for (const element of statement.exportClause.elements) {
          const exported = element.name.text;
          const local = (element.propertyName ?? element.name).text;
          const elementTypeOnly = typeOnly || element.isTypeOnly;
          if (module) {
            explicit.set(exported, { kind: 'reexport', module, name: local, typeOnly: elementTypeOnly });
          } else if (imports.has(local)) {
            const imported = imports.get(local);
            explicit.set(exported, { ...imported, typeOnly: imported.typeOnly || elementTypeOnly });
          } else {
            explicit.set(exported, LOCAL);
          }
        }
      }
    } else if (ts.isExportAssignment(statement)) {
      const name = ts.isIdentifier(statement.expression) ? statement.expression.text : null;
      explicit.set('default', imports.get(name) ?? LOCAL);
    } else if (ts.canHaveModifiers(statement)) {
      const modifiers = ts.getModifiers(statement) ?? [];
      if (!modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) continue;
      const isDefault = modifiers.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);
      if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name)) explicit.set(declaration.name.text, LOCAL);
        }
      } else if (isDefault) {
        explicit.set('default', LOCAL);
      } else if (statement.name) {
        explicit.set(statement.name.text, LOCAL);
      }
    }
  }

  return { explicit, stars };
}

/** @returns {(module: string, name: string) => Outcome} */
function createResolver(/** @type {{ legacy: ScanIndex, current: ScanIndex }} */ { legacy, current }) {
  const moduleByFile = new Map([...legacy].map(([module, { filePath }]) => [filePath, module]));
  const shims = new Map();

  function shimOf(filePath) {
    if (!shims.has(filePath)) shims.set(filePath, analyzeShim(filePath));
    return shims.get(filePath);
  }

  function moduleOf(specifier, fromFile) {
    if (!specifier.startsWith('.')) return specifier;
    const base = path.resolve(path.dirname(fromFile), specifier);
    for (const candidate of [`${base}.ts`, `${base}.js`, path.join(base, 'index.ts')]) {
      if (moduleByFile.has(candidate)) return moduleByFile.get(candidate);
    }
    return null;
  }

  function resolve(module, name, depth = 0) {
    if (depth > MAX_DEPTH) return LOST;

    const target = current.get(module);
    if (target) {
      if (!target.exports.has(name)) return LOST;
      return { kind: 'rule', replacement: { module, export: name, typeOnly: target.exports.get(name) } };
    }

    const filePath = legacy.get(module)?.filePath;
    if (!filePath) return LOST;
    const { explicit, stars } = shimOf(filePath);

    const source = explicit.get(name);
    if (source?.kind === 'local') return LOCAL;
    if (source) {
      const next = moduleOf(source.module, filePath);
      return next ? resolve(next, source.name, depth + 1) : LOST;
    }

    for (const star of stars) {
      const next = moduleOf(star.module, filePath);
      if (!next) continue;
      const outcome = resolve(next, name, depth + 1);
      if (outcome.kind !== 'lost') return outcome;
    }
    return LOST;
  }

  return resolve;
}

function toEntry(token, outcome) {
  const { module, export: name, typeOnly } = token;
  if (outcome.kind === 'rule') return { module, export: name, typeOnly, replacement: outcome.replacement };
  return { module, export: name, typeOnly, replacement: null, reason: outcome.kind };
}

function compareEntries(a, b) {
  if (a.module !== b.module) return a.module < b.module ? -1 : 1;
  if (a.export !== b.export) return a.export < b.export ? -1 : 1;
  return Number(a.typeOnly) - Number(b.typeOnly);
}

async function generate() {
  const tokens = JSON.parse(readFileSync(SNAPSHOT, 'utf8'));
  const scanTree = (dir) =>
    scan({ root: REPO_ROOT, packagesDir: path.join(REPO_ROOT, dir), configName: 'tsdown.config.mjs' }).then(indexScan);
  const [legacy, current] = await Promise.all([scanTree('packages'), scanTree('warp-drive-packages')]);
  const resolve = createResolver({ legacy, current });

  const entries = tokens.map((token) => toEntry(token, resolve(token.module, token.export))).sort(compareEntries);
  const counts = { rule: 0, local: 0, lost: 0 };
  for (const entry of entries) counts[entry.replacement ? 'rule' : entry.reason] += 1;

  return {
    content: JSON.stringify(entries, null, 2) + '\n',
    summary: `${entries.length} tokens: ${counts.rule} rules, ${counts.local} local, ${counts.lost} lost`,
  };
}

async function main() {
  const check = process.argv.includes('--check');
  const { content, summary } = await generate();

  if (!check) {
    writeFileSync(SHIPPED, content, 'utf8');
    process.stdout.write(`${summary}\n`);
    return;
  }

  const committed = readFileSync(SHIPPED, 'utf8');
  if (committed !== content) {
    spawnSync('diff', ['-u', SHIPPED, '-'], { input: content, stdio: ['pipe', 'inherit', 'inherit'] });
    const shipped = path.relative(REPO_ROOT, SHIPPED);
    const script = path.relative(REPO_ROOT, url.fileURLToPath(import.meta.url));
    process.stdout.write(`${summary}\n${shipped} is out of date. Run \`node ${script}\` and commit the result.\n`);
    process.exit(1);
  }
  process.stdout.write(`${summary}\n`);
}

main().catch((err) => {
  console.error('Failed to resolve the legacy import mapping:', err);
  process.exit(1);
});
