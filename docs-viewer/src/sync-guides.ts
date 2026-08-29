#! /usr/bin/env bun

import { $ } from 'bun';
import { watch, existsSync, readdirSync } from 'fs';
import { join } from 'path';

import { main } from './prepare-website';
import { postProcessApiDocs } from './site-utils';

const guidesPath = join(__dirname, '../../guides');
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
  watch(skillsPath, { recursive: true }, onContentChange);
}

if (build) {
  await $`vitepress build docs.warp-drive.io`;
} else {
  await $`vitepress dev docs.warp-drive.io`;
}
