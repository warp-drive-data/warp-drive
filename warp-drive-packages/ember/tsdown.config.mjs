import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import ts from 'typescript';

import { createConfig } from '@warp-drive/internal-config/tsdown/config.js';

export const externals = [
  '@ember/template-compilation',
  '@ember/component/template-only',
  '@glint/template',
  '@ember/component', // unsure where this comes from
  '@ember/service',
  '@ember/owner',
  '@glimmer/component',
  '@ember/test-waiters',
  '@glimmer/tracking',
  '@glimmer/validator',
  '@ember/object/compat',
  '@ember/-internals/metal',
  '@ember/runloop',
];
export const entryPoints = ['./src/index.ts', './src/install.ts', './src/experiments.ts'];

/**
 * The doc comment carrying the `@module` tag at the top of an entry point, as
 * TypeScript parses it, or undefined if the entry has none.
 *
 * @param {string} entry a path from `entryPoints`
 * @returns {string | undefined}
 */
function moduleDocComment(entry) {
  const text = readFileSync(new URL(entry, import.meta.url), 'utf-8');
  const [firstStatement] = ts.createSourceFile(entry, text, ts.ScriptTarget.Latest, true).statements;
  if (!firstStatement) return undefined;
  const moduleDoc = ts
    .getJSDocCommentsAndTags(firstStatement)
    .filter(ts.isJSDoc)
    .find((doc) => doc.tags?.some((tag) => tag.tagName.text === 'module'));
  return moduleDoc && text.slice(moduleDoc.pos, moduleDoc.end);
}

/**
 * TypeDoc cannot parse the `.gts` components this package re-exports, so
 * `typedoc.config.mjs` points it at `dist/*.d.ts` instead of `src`. The d.ts
 * bundler keeps only the comments attached to declarations, so it drops each
 * entry's file-level `@module` comment, which is attached to the file's first
 * `import` or `export ... from` statement. Without that comment TypeDoc renders
 * the entry's API page with no summary or text, and renders `index` as a stray
 * sub-module instead of folding it into the package root via
 * `@mergeModuleWith <project>`. Copy each entry's comment back onto the top of
 * its declaration chunk.
 */
const moduleDocs = new Map(
  entryPoints.map((entry) => [basename(entry).replace(/\.ts$/, '.d.ts'), moduleDocComment(entry)])
);

/**
 * TypeScript treats every top-level declaration in a `.d.ts` module as exported unless the
 * file has an `export` declaration or assignment; an `export` modifier doesn't count. The
 * d.ts bundler writes `install.d.ts` with only modifiers, so its unexported `type Tag` became
 * an export and TypeDoc gave it an API page. An empty `export {}` restores the source's own
 * exports and nothing else.
 */
const EXPLICIT_EXPORTS_ONLY = 'export {};';

export default createConfig(
  {
    entryPoints,
    externals,
    compileTypes: process.env.IS_UNPKG_BUILD !== 'true',
    banner: ({ fileName }) => moduleDocs.get(fileName),
    footer: ({ fileName }) => (fileName.endsWith('.d.ts') ? EXPLICIT_EXPORTS_ONLY : undefined),
  },
  import.meta.resolve
);
