import { BunFile } from 'bun';
import { styleText } from 'node:util';

import { exec } from '../../../utils/cmd.ts';
import { confirm } from '../../publish/steps/confirm-strategy.ts';

export async function confirmCommitChangelogs(
  _changedFiles: BunFile[],
  config: Map<string, string | number | boolean | null>,
  versions: Map<string, string>
) {
  const dryRun = config.get('dry_run') as boolean;

  if (config.get('commit') === false) {
    console.log(styleText('gray', `\t➠ Skipped commit of changelogs.`));
    return;
  }

  try {
    await confirm({
      prompt: `Do you want to commit the changelogs?`,
      cancelled: `🚫 Commit of changelogs cancelled. Exiting...`,
    });
  } finally {
    if (dryRun) {
      // cleanup files because we're not actually committing
      await exec(['sh', '-c', `git add -A && git reset --hard HEAD`]);
    }
  }

  if (!dryRun) {
    const newVersion = versions.get('root')!;
    await exec(['sh', '-c', `git add -A && git commit -m "chore: update changelogs for v${newVersion}"`]);

    if (config.get('upstream')) {
      await exec(['sh', '-c', `git push`]);
      console.log(styleText('gray', `\t✅ pushed changelog commit to upstream.`));
    } else {
      console.log(styleText('gray', `\t➠ Skipped push of changelogs.`));
    }
  }
}
