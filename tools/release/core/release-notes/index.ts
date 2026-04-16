import { parseRawFlags } from '../../utils/parse-args';
import { printHelpDocs } from '../../help/docs';
import { GIT_TAG, getAllPackagesForGitTag, getGitState } from '../../utils/git';
import { gatherPackages, loadStrategy } from '../../utils/package';
import { applyStrategy } from '../publish/steps/generate-strategy';
import { printStrategy } from '../publish/steps/print-strategy';
import { confirmStrategy } from '../publish/steps/confirm-strategy';
import { release_notes_flags_config } from '../../utils/flags-config';
import { SEMVER_VERSION } from '../../utils/channel';
import { updateChangelogs } from './steps/update-changelogs';
import { getChanges } from './steps/get-changes';
import { confirmCommitChangelogs } from './steps/confirm-changelogs';

export async function executeReleaseNoteGeneration(args: string[]) {
  // get user supplied config
  const config = await parseRawFlags(args, release_notes_flags_config);

  if (config.full.get('help')) {
    return printHelpDocs(args);
  }

  // get git info
  await getGitState(config.full);

  // get configured strategy
  const strategy = await loadStrategy();

  // get packages present in the git tag version
  const fromVersion = config.full.get('from') as SEMVER_VERSION;
  const fromTag = `v${fromVersion}` as GIT_TAG;
  const baseVersionPackages = await getAllPackagesForGitTag(fromTag);

  // get packages present on our current branch
  const packages = await gatherPackages(strategy.config);

  // get applied strategy
  const applied = await applyStrategy(config.full, strategy, baseVersionPackages, packages);

  // print strategy to be applied
  await printStrategy(config.full, applied);

  // confirm we should continue
  await confirmStrategy();

  // generate the list of changes
  const allChanges = await getChanges(strategy.config, packages, fromTag);
  // for a normal release there is exactly one entry (the unreleased block)
  const newChanges = allChanges[0];

  const versions = new Map<string, string>();
  for (const [pkgName, strategy] of applied.all.entries()) {
    versions.set(pkgName, strategy.toVersion);
  }

  const toTag = `v${versions.get('root')!}`;
  const date = new Date().toISOString().split('T')[0];

  // update all changelogs, including the primary changelog
  // and the changelogs for each package in changelogRoots
  // this will not commit the changes
  const changedFiles = await updateChangelogs(fromTag, toTag, date, newChanges, config.full, strategy.config, packages);

  await confirmCommitChangelogs(changedFiles, config.full, versions);
}
