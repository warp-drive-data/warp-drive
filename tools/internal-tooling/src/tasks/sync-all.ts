import debug from 'debug';
import { styleText } from 'node:util';

const log = debug('wd:sync-all');

import { main as syncLogos } from './sync-logos';
import { main as syncLicense } from './sync-license';
import { main as syncReferences } from './sync-references';
import { main as syncScripts } from './sync-scripts';

function isError(error: unknown): error is Error {
  return error instanceof Error;
}

async function runTask(name: string, task: () => Promise<void>) {
  log(styleText('greenBright', `♻️ Sync ${name}`));
  try {
    await task();
  } catch (error) {
    log(styleText('red', `Error Syncing ${name}: ${styleText('yellow', isError(error) ? error.message : error)}`));
  }
}

export async function main() {
  log(`Running all sync tasks`);

  await runTask('Logos', syncLogos);
  await runTask('License', syncLicense);
  await runTask('References', syncReferences);
  await runTask('Scripts', syncScripts);
}
