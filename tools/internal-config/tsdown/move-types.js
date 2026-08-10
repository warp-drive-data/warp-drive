import chalk from 'chalk';
import path from 'path';
import { globby } from 'globby';
import fs from 'fs';
import JSONC from 'comment-json';
import debug from 'debug';

import { fixViteHijack } from '../rollup/external.js';

const log = debug('wd:build:move-types');
log.enabled = true;

/**
 * tsdown/rolldown-plugin-dts colocates emitted `.d.ts` (and `.d.ts.map`) files
 * alongside the `.js` output in a single `outDir`. This repo's `exports` map,
 * `turbo.json`, and release pipeline all expect declarations in a separate
 * package-root `declarations/` directory (matching `tsconfig.json`'s
 * `declarationDir`), so this plugin relocates them there after each build.
 */
export function MoveTypesToDestination(options, resolve) {
  return {
    name: 'MoveTypesToDestination',
    async writeBundle(outputOptions) {
      const outDir = outputOptions.dir;
      if (!outDir) {
        log(`No output dir on writeBundle options, skipping MoveTypesToDestination`);
        return;
      }

      const tsconfigPath = fixViteHijack(resolve('./tsconfig.json').slice(7));
      if (!fs.existsSync(tsconfigPath)) {
        log(`No tsconfig detected, skipping MoveTypesToDestination`);
        return;
      }
      const tsconfig = JSONC.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      const relativeOutputPath = tsconfig.compilerOptions?.declarationDir ?? './declarations';
      const projectDir = tsconfigPath.replace('/tsconfig.json', '/');
      const outputPath = path.join(projectDir, relativeOutputPath);
      const inputPath = path.resolve(outDir);

      // `declarations/` lives outside tsdown's own `outDir`, so tsdown's
      // `clean` option never touches it. Without clearing it first, stale
      // `.d.ts` files from a previous whole-program `tsc`/`ember-tsc --build`
      // run (which also targets `declarationDir`) can linger alongside this
      // build's freshly-rolled-up output and confuse dts-consuming tooling.
      fs.rmSync(outputPath, { recursive: true, force: true });

      console.log(
        chalk.grey(
          chalk.bold(
            `\nMoving ${chalk.cyan('**/*.d.ts')} files\n\tfrom: ${chalk.yellow(
              path.relative(projectDir, inputPath)
            )}\n\tto: ${chalk.yellow(relativeOutputPath)}`
          )
        )
      );

      const files = await globby([`${inputPath}/**/*.d.ts`, `${inputPath}/**/*.d.ts.map`]);

      if (files.length === 0) {
        log(chalk.red(`\nNo **/*.d.ts files found in ${chalk.white(inputPath)}\n`));
        return;
      }

      log(chalk.grey(`\nFound ${chalk.cyan(files.length)} files\n`));

      for (const file of files) {
        const relativeFile = path.relative(projectDir, file);
        const innerPath = path.relative(inputPath, file);
        const outputFile = path.resolve(outputPath, innerPath);
        const relativeOutFile = path.relative(projectDir, outputFile);

        log(chalk.grey(`\t${chalk.cyan(relativeFile)} => ${chalk.green(relativeOutFile)}`));

        // ensure the output directory exists
        const outDirForFile = path.dirname(outputFile);
        fs.mkdirSync(outDirForFile, { recursive: true });
        fs.renameSync(file, outputFile);
      }

      console.log(chalk.grey(chalk.bold(`\n✅ Moved ${chalk.cyan(files.length)} files\n`)));
    },
  };
}
