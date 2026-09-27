#!/usr/bin/env node

import { execa } from 'execa';
import { watch, existsSync, readdirSync } from 'fs';
import { join } from 'path';

import { emitIndexMarkdown } from './emit-index-markdown.ts';
import { emitLegacyLlms } from './emit-legacy-llms.ts';
import { main } from './prepare-website.ts';
import { postProcessApiDocs } from './site-utils.ts';

const docsViewerRoot = join(import.meta.dirname, '..');

const guidesPath = join(import.meta.dirname, '../../guides');
const upgradingPath = join(import.meta.dirname, '../../upgrading');
const blogPath = join(import.meta.dirname, '../../blog');
const rfcsPath = join(import.meta.dirname, '../../rfcs');
const skillsPath = join(import.meta.dirname, '../../warp-drive-packages/memory-alpha/skills');
const apiDocsPath = join(import.meta.dirname, '../tmp/api');
const oldPackages = join(import.meta.dirname, '../../packages');
const newPackages = join(import.meta.dirname, '../../warp-drive-packages');

/** runs a bin from this package's node_modules/.bin in the docs-viewer root, streaming its output */
async function run(bin: string, args: string[]) {
  await execa(bin, args, { cwd: docsViewerRoot, preferLocal: true, stdio: 'inherit' });
}

async function updateApiDocs() {
  await run('typedoc', []);
  await postProcessApiDocs();
}

/** runs a rebuild from a watcher callback, reporting its failure without taking down the dev server */
function rebuild(stage: string, task: () => Promise<unknown>) {
  console.log('rebuilding');
  void task().catch((error: unknown) => console.error(`${stage} failed:`, error));
}

const build = process.argv.slice().includes('--build');

// ensure directory exists and can be watched
if (!existsSync(apiDocsPath) || process.argv.slice().includes('--force')) {
  await updateApiDocs();
}

const Packages: string[] = [];
for (const packagePath of readdirSync(oldPackages)) {
  if (existsSync(join(oldPackages, packagePath, 'typedoc.config.mjs'))) {
    Packages.push(join(oldPackages, packagePath, 'src'));
  }
}
for (const packagePath of readdirSync(newPackages)) {
  const srcPath = join(newPackages, packagePath, 'src');
  // packages with no source (e.g. memory-alpha, which is markdown-only) have nothing to watch here
  if (existsSync(join(newPackages, packagePath, 'typedoc.config.mjs')) && existsSync(srcPath)) {
    Packages.push(srcPath);
  }
}

let debounce: ReturnType<typeof setTimeout> | null = null;
let packageDebounce: ReturnType<typeof setTimeout> | null = null;

if (!build) {
  for (const packagePath of Packages) {
    watch(
      packagePath,
      {
        recursive: true,
      },
      () => {
        console.log('package changed', packagePath);
        if (packageDebounce) {
          console.log('debounced');
          clearTimeout(packageDebounce);
        }
        packageDebounce = setTimeout(() => {
          packageDebounce = null;
          rebuild('API docs rebuild', updateApiDocs);
        }, 1000);
      }
    );
  }

  const onContentChange = (eventName: string, fileName: string | null) => {
    console.log('triggered', eventName, fileName);
    if (debounce) {
      console.log('debounced');
      clearTimeout(debounce);
    }
    debounce = setTimeout(() => {
      debounce = null;
      rebuild('content sync', main);
    }, 100);
  };

  watch(guidesPath, { recursive: true }, onContentChange);
  watch(upgradingPath, { recursive: true }, onContentChange);
  watch(blogPath, { recursive: true }, onContentChange);
  watch(rfcsPath, { recursive: true }, onContentChange);
  watch(skillsPath, { recursive: true }, onContentChange);
}

if (build) {
  await run('vitepress', ['build', 'docs.warp-drive.io']);
  const copied = emitIndexMarkdown(join(import.meta.dirname, '../docs.warp-drive.io/.vitepress/dist'));
  console.log(`emitted ${copied} index.md twins for directory-index pages`);
  const legacy = emitLegacyLlms(join(import.meta.dirname, '../docs.warp-drive.io/.vitepress/dist'), apiDocsPath);
  console.log(
    `emitted llms-legacy.txt and llms-legacy-full.txt with ${legacy.guides} legacy guides and ${legacy.pages} legacy API pages`
  );
  if (legacy.missingTwins.length) {
    throw new Error(
      `llms-legacy-full.txt is missing pages with no .md twin in dist: ${legacy.missingTwins.join(', ')}`
    );
  }
} else {
  await run('vitepress', ['dev', 'docs.warp-drive.io']);
}
