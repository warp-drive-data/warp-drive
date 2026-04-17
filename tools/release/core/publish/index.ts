import { publish_flags_config } from '../../utils/flags-config';
import { parseRawFlags, printConfig } from '../../utils/parse-args';
import { GIT_TAG, getAllPackagesForGitTag, getGitState } from '../../utils/git';
import { printHelpDocs } from '../../help/docs';
import { bumpAllPackages, restorePackagesForDryRun } from './steps/bump-versions';
import { generatePackageTarballs, verifyTarballs } from './steps/generate-tarballs';
import { generateMirrorTarballs } from './steps/generate-mirror-tarballs';
import { printStrategy } from './steps/print-strategy';
import { AppliedStrategy, applyStrategy } from './steps/generate-strategy';
import { confirmStrategy } from './steps/confirm-strategy';
import { publishPackages } from './steps/publish-packages';
import { gatherPackages, loadStrategy } from '../../utils/package';
import { CHANNEL, SEMVER_VERSION } from '../../utils/channel';
import { confirmCommitChangelogs } from '../release-notes/steps/confirm-changelogs';
import { updateChangelogs } from '../release-notes/steps/update-changelogs';
import { getChanges } from '../release-notes/steps/get-changes';
import { generateTypesTarballs } from './steps/generate-types-tarballs';

export async function executePublish(args: string[]) {
  // get user supplied config
  const config = await parseRawFlags(args, publish_flags_config);

  if (config.full.get('help')) {
    return printHelpDocs(args);
  }

  printConfig(config);

  const dryRun = config.full.get('dry_run') as boolean;

  // get git info
  await getGitState(config.full);

  // get configured strategy
  const strategy = await loadStrategy();

  // get packages present on our current branch
  const packages = await gatherPackages(strategy.config);

  // get packages present in the git tag version
  // if no version is specified, we will use the current branch
  const fromVersion = config.full.get('from') as SEMVER_VERSION | undefined;
  const fromTag = `v${fromVersion}` as GIT_TAG;
  const baseVersionPackages = config.specified.get('from') ? await getAllPackagesForGitTag(fromTag) : packages;

  // get applied strategy
  const applied = await applyStrategy(config.full, strategy, baseVersionPackages, packages);

  // print strategy to be applied
  await printStrategy(config.full, applied);

  await confirmStrategy();

  const versions = new Map<string, string>();
  for (const [pkgName, pkg] of applied.all.entries()) {
    versions.set(pkgName, pkg.toVersion);
  }

  const channel = config.full.get('channel') as CHANNEL;
  if (channel !== 'canary' && channel !== 'beta' && fromVersion) {
    // generate the list of changes (first entry is the unreleased block)
    const changesets = await getChanges(strategy.config, packages, fromTag);
    const newChanges = changesets[0];
    if (!newChanges) {
      throw new Error(
        `lerna-changelog produced no parseable output from ${fromTag}. Check the log above for the raw output.`
      );
    }

    const toTag = `v${versions.get('root')!}` as GIT_TAG;
    const date = new Date().toISOString().split('T')[0];

    // update all changelogs, including the primary changelog
    // and the changelogs for each package in changelogRoots
    // this will not commit the changes
    const changedFiles = await updateChangelogs(fromTag, toTag, date, newChanges, config.full, strategy.config, packages);

    await confirmCommitChangelogs(changedFiles, config.full, versions);
  }

  // Bump package.json versions & commit/tag
  // ========================
  await bumpAllPackages(config.full, packages, applied.all);

  if (dryRun) await restorePackagesForDryRun(packages, applied.all);

  // Generate Tarballs in tmp/tarballs/<root-version>
  // Having applied the types publishing strategy "just in time"
  // ========================
  if (config.full.get('pack')) {
    await generatePackageTarballs(config.full, packages, applied.public_pks);
    await generateMirrorTarballs(config.full, packages, applied.public_pks);
    await generateTypesTarballs(config.full, packages, applied.public_pks);
  } else {
    console.log(`Skipped Pack`);
  }

  await verifyTarballs(config.full, packages, applied.public_pks);

  // Publish to NPM registry
  // ========================
  if (config.full.get('publish')) await publishPackages(config.full, packages, applied.public_pks);
  else console.log(`Skipped Publish`);
}
