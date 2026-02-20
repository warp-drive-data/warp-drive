import chalk from 'chalk';
import ignore from 'ignore';
import jscodeshift from 'jscodeshift';
import path from 'path';

import type { LegacyStoreMethod } from './config.js';
import transform from './index.js';
import { log } from './log.js';

export interface RunOptions {
  patterns: string[];
  dry?: boolean;
  ignore?: string[];
  storeNames: string[];
  methods?: LegacyStoreMethod[];
}

export async function runTransform(runOptions: RunOptions) {
  const { patterns, ...options } = runOptions;

  const ig = ignore().add(['**/*.d.ts', '**/node_modules/**/*', '**/dist/**/*', ...(options.ignore ?? [])]);

  log.debug('Running with options:', { targetGlobPattern: patterns, ...options });
  log.debug('Running for paths:', Bun.inspect(patterns));
  if (options.dry) {
    log.warn('Running in dry mode. No files will be modified.');
  }

  /**
   * | Result       | How-to                      | Meaning                                            |
   * | :------      | :------                     | :-------                                           |
   * | `errors`     | `throw`                     | we attempted to transform but encountered an error |
   * | `unmodified` | return `string` (unchanged) | we attempted to transform but it was unnecessary   |
   * | `skipped`    | return `undefined`          | we did not attempt to transform                    |
   * | `ok`         | return `string` (changed)   | we successfully transformed                        |
   */
  const result = {
    matches: 0,
    errors: 0,
    unmodified: 0,
    skipped: 0,
    ok: 0,
  };
  const j = jscodeshift.withParser('ts');

  for (const pattern of patterns) {
    const glob = new Bun.Glob(pattern);
    for await (const filepath of glob.scan('.')) {
      if (ig.ignores(path.join(filepath))) {
        log.warn('Skipping ignored file:', filepath);
        result.skipped++;
        continue;
      }
      log.debug('Transforming:', filepath);
      result.matches++;
      const file = Bun.file(filepath);
      const originalSource = await file.text();
      let transformedSource: string | undefined;
      try {
        transformedSource = transform(
          { source: originalSource, path: filepath },
          {
            j,
            jscodeshift: j,
            stats: (_name: string, _quantity?: number): void => {},
            report: (_msg: string): void => {},
          },
          options
        );
      } catch (error) {
        result.errors++;
        log.error({
          filepath,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        continue;
      }

      if (transformedSource === undefined) {
        result.skipped++;
      } else if (transformedSource === originalSource) {
        result.unmodified++;
      } else {
        if (options.dry) {
          log.info({
            filepath,
            message: 'Transformed source:\n\t' + transformedSource,
          });
        } else {
          await Bun.write(filepath, transformedSource);
        }
        result.ok++;
      }
    }
  }

  if (result.matches === 0) {
    log.warn('No files matched the provided glob pattern(s):', patterns);
  }

  if (result.errors > 0) {
    log.info(chalk.red(`${result.errors} error(s). See logs above.`));
  } else if (result.matches > 0) {
    log.success('Zero errors! 🎉');
  }
  if (result.skipped > 0) {
    log.info(chalk.yellow(`${result.skipped} skipped file(s).`, chalk.gray('Transform did not run. See logs above.')));
  }
  if (result.unmodified > 0) {
    log.info(`${result.unmodified} unmodified file(s).`, chalk.gray('Transform ran but no changes were made.'));
  }
  if (result.ok > 0) {
    log.info(chalk.green(`${result.ok} transformed file(s).`));
  }
}
