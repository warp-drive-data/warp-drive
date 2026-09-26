#! /usr/bin/env bun

import { $ } from 'bun';
import { watch, existsSync, readdirSync } from 'fs';
import { join } from 'path';

import { emitIndexMarkdown } from './emit-index-markdown';
import { emitLegacyLlms } from './emit-legacy-llms';
import { main } from './prepare-website';
import { postProcessApiDocs } from './site-utils';

const guidesPath = join(__dirname, '../../guides');
const upgradingPath = join(__dirname, '../../upgrading');
const blogPath = join(__dirname, '../../blog');
const rfcsPath = join(__dirname, '../../rfcs');
const skillsPath = join(__dirname, '../../warp-drive-packages/memory-alpha/skills');
const apiDocsPath = join(__dirname, '../tmp/api');
const oldPackages = join(__dirname, '../../packages');
const newPackages = join(__dirname, '../../warp-drive-packages');

async function updateApiDocs() {
  await $`typedoc`;
  postProcessApiDocs();
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
        debounce = setTimeout(() => {
          console.log('rebuilding');
          updateApiDocs();
          debounce = null;
        }, 1000);
      }
    );
  }

  const onContentChange = (eventName: 'rename' | 'change', fileName: string) => {
    console.log('triggered', eventName, fileName);
    if (debounce) {
      console.log('debounced');
      clearTimeout(debounce);
    }
    debounce = setTimeout(() => {
      console.log('rebuilding');
      main();
      debounce = null;
    }, 100);
  };

  // @ts-expect-error missing from Bun types
  watch(guidesPath, { recursive: true }, onContentChange);
  // @ts-expect-error missing from Bun types
  watch(upgradingPath, { recursive: true }, onContentChange);
  // @ts-expect-error missing from Bun types
  watch(blogPath, { recursive: true }, onContentChange);
  // @ts-expect-error missing from Bun types
  watch(rfcsPath, { recursive: true }, onContentChange);
  // @ts-expect-error missing from Bun types
  watch(skillsPath, { recursive: true }, onContentChange);
}

if (build) {
  await $`vitepress build docs.warp-drive.io`;
  const copied = emitIndexMarkdown(join(__dirname, '../docs.warp-drive.io/.vitepress/dist'));
  console.log(`emitted ${copied} index.md twins for directory-index pages`);
  const legacy = emitLegacyLlms(join(__dirname, '../docs.warp-drive.io/.vitepress/dist'), apiDocsPath);
  console.log(
    `emitted llms-legacy.txt and llms-legacy-full.txt with ${legacy.guides} legacy guides and ${legacy.pages} legacy API pages`
  );
  if (legacy.missingTwins.length) {
    throw new Error(
      `llms-legacy-full.txt is missing pages with no .md twin in dist: ${legacy.missingTwins.join(', ')}`
    );
  }
} else {
  await $`vitepress dev docs.warp-drive.io`;
}
