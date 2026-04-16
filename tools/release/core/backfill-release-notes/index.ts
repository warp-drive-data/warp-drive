import { parseRawFlags } from '../../utils/parse-args.ts';
import { printHelpDocs } from '../../help/docs.ts';
import { GIT_TAG, getAllPackagesForGitTag, getGitState } from '../../utils/git.ts';
import { gatherPackages, loadStrategy } from '../../utils/package.ts';
import { applyStrategy } from '../publish/steps/generate-strategy.ts';
import { printStrategy } from '../publish/steps/print-strategy.ts';
import { confirmStrategy } from '../publish/steps/confirm-strategy.ts';
import { release_notes_flags_config } from '../../utils/flags-config.ts';
import { SEMVER_VERSION } from '../../utils/channel.ts';
import { updateChangelogs } from '../release-notes/steps/update-changelogs.ts';
import { getChanges } from '../release-notes/steps/get-changes.ts';
import { confirmCommitChangelogs } from '../release-notes/steps/confirm-changelogs.ts';

export async function backfillReleaseNotes(args: string[]) {
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
  // const baseVersionPackages = await getAllPackagesForGitTag(fromTag);

  // get packages present on our current branch
  const packages = await gatherPackages(strategy.config);

  // generate the list of changes — lerna outputs versions newest→oldest, so reverse for insertion order
  const allChanges = (await getChanges(strategy.config, packages, fromTag)).reverse();

  // update all changelogs one version at a time, oldest→newest
  // each version is inserted before the previous one, building up the history correctly
  let changedFiles: Awaited<ReturnType<typeof updateChangelogs>> = [];
  let previousTag = fromTag;
  for (const versionedChanges of allChanges) {
    const files = await updateChangelogs(
      previousTag,
      versionedChanges.tag,
      versionedChanges.date,
      versionedChanges,
      config.full,
      strategy.config,
      packages
    );
    changedFiles = changedFiles.concat(files);
    previousTag = versionedChanges.tag as GIT_TAG;
  }

  const versions = new Map<string, string>();
  for (const [pkgName, pkg] of packages.entries()) {
    versions.set(pkgName, pkg.pkgData.version);
  }

  await confirmCommitChangelogs(changedFiles, config.full, versions);
}
