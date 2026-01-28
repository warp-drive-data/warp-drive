import { publish_flags_config } from '../../utils/flags-config.ts';
import { parseRawFlags, printConfig } from '../../utils/parse-args.ts';
import { GIT_TAG, getAllPackagesForGitTag, getGitState } from '../../utils/git.ts';
import { printHelpDocs } from '../../help/docs.ts';
import { bumpAllPackages, restorePackagesForDryRun } from './steps/bump-versions.ts';
import { generatePackageTarballs, verifyTarballs } from './steps/generate-tarballs.ts';
import { generateMirrorTarballs } from './steps/generate-mirror-tarballs.ts';
import { printStrategy } from './steps/print-strategy.ts';
import { AppliedStrategy, applyStrategy } from './steps/generate-strategy.ts';
import { confirmStrategy } from './steps/confirm-strategy.ts';
import { publishPackages } from './steps/publish-packages.ts';
import { gatherPackages, loadStrategy } from '../../utils/package.ts';
import { CHANNEL, SEMVER_VERSION } from '../../utils/channel.ts';
import { confirmCommitChangelogs } from '../release-notes/steps/confirm-changelogs.ts';
import { updateChangelogs } from '../release-notes/steps/update-changelogs.ts';
import { getChanges } from '../release-notes/steps/get-changes.ts';
import { generateTypesTarballs } from './steps/generate-types-tarballs.ts';
import { readFileSync } from 'node:fs';

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

  const channel = config.full.get('channel') as CHANNEL;
  if (channel !== 'canary' && channel !== 'beta') {
    // generate the list of changes
    const newChanges = await getChanges(strategy, packages, fromTag);

    // update all changelogs, including the primary changelog
    // and the changelogs for each package in changelogRoots
    // this will not commit the changes
    const changedFiles = await updateChangelogs(fromTag, newChanges, config.full, strategy, packages, applied);

    await confirmCommitChangelogs(changedFiles, config.full, applied);
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
    await printDirtyFiles('Primary Packages');
    await generateMirrorTarballs(config.full, packages, applied.public_pks);
    await printDirtyFiles('Mirror Packages');
    await generateTypesTarballs(config.full, packages, applied.public_pks);
    await printDirtyFiles('Types Packages');
  } else {
    console.log(`Skipped Pack`);
  }

  await verifyTarballs(config.full, packages, applied.public_pks);

  // Publish to NPM registry
  // ========================
  if (config.full.get('publish')) await publishPackages(config.full, packages, applied.public_pks);
  else console.log(`Skipped Publish`);
}

export async function printDirtyFiles(label: string) {
  const { execSync } = await import('node:child_process');
  const dirtyFiles = execSync('git ls-files -m').toString().trim();
  if (dirtyFiles) {
    console.log(`The following files were modified in ${label}:`);
    console.log(dirtyFiles);
  } else {
    console.log('No files were modified.');
  }

  // check the specific dist file we are having issues with
  // warp-drive-packages/utilities/dist/index.js
  const filePath = 'warp-drive-packages/utilities/dist/index.js';
  const fullPath = `${process.cwd()}/${filePath}`;
  const fileContents = readFileSync(fullPath, 'utf-8');

  // check if we are accidentally in cjs format
  if (isCjsModule(fileContents)) {
    throw new Error(`Detected CommonJS module format in ${filePath} after ${label}. Expected ES Module format.`);
  }
}

const CjsModulePattern = `Object.defineProperty(exports, Symbol.toStringTag, {
  value: 'Module'
});`;

function isCjsModule(fileContents: string): boolean {
  return fileContents.includes(CjsModulePattern);
}
