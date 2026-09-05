import { styleText } from 'node:util';

import { printHelpDocs } from '../../help/docs.ts';
import { SEMVER_VERSION } from '../../utils/channel.ts';
import { exec } from '../../utils/cmd.ts';
import { promote_flags_config } from '../../utils/flags-config.ts';
import { GIT_TAG, getAllPackagesForGitTag, getGitState, pushLTSTagToRemoteBranch } from '../../utils/git.ts';
import { Package } from '../../utils/package.ts';
import { parseRawFlags } from '../../utils/parse-args.ts';
import { colorName } from '../publish/steps/print-strategy.ts';

export async function promoteToLTS(args: string[]) {
  // get user supplied config
  const config = await parseRawFlags(args, promote_flags_config);
  const gitTag: GIT_TAG = `v${config.full.get('version') as SEMVER_VERSION}`;

  if (config.full.get('help')) {
    return printHelpDocs(args);
  }

  const packages = await getAllPackagesForGitTag(gitTag);
  const versionsToPromote = getPublicPackageVersions(packages);

  await updateTags(config.full, versionsToPromote);

  if (config.full.get('upstream') && !config.full.get('dry_run')) {
    try {
      await pushLTSTagToRemoteBranch(gitTag, true);
    } catch (e) {
      console.error(styleText('red', `NPM Tag Updated, but failed to update the remote lts branch for ${gitTag}`));
      console.error(e);
    }
  }
}

export function getPublicPackageVersions(packages: Map<string, Package>): Map<string, SEMVER_VERSION> {
  const publicPackages = new Map<string, SEMVER_VERSION>();
  packages.forEach((pkg, name) => {
    if (!pkg.pkgData.private) {
      publicPackages.set(name, pkg.pkgData.version);
    }
  });
  return publicPackages;
}

export async function updateTags(
  config: Map<string, string | number | boolean | null>,
  packages: Map<string, SEMVER_VERSION>
) {
  const distTag = config.get('tag') as string;
  const dryRun = config.get('dry_run') as boolean;
  const errors: Error[] = [];

  for (const [pkgName, version] of packages) {
    const error = await updateDistTag(pkgName, version, distTag, dryRun);
    if (error) {
      console.log(styleText('red', `\t🚫 Error updating dist-tag for ${colorName(pkgName)}: ${error.message}`));
      errors.push(error);
      continue;
    }
    console.log(
      styleText(
        'green',
        `\t✅ ${colorName(pkgName)} ${styleText('green', version)} => ${styleText('magenta', distTag)}`
      )
    );
  }

  console.log(
    `✅ ` +
      styleText(
        'cyan',
        `Moved ${styleText('greenBright', String(packages.size - errors.length))} 📦 packages to ${styleText('magenta', distTag)} channel`
      )
  );
  if (errors.length > 0) {
    console.log(styleText('red', `🚫 ${errors.length} errors occurred while updating dist-tags`));
    for (const error of errors) {
      console.log(styleText('red', error.message));
    }
    throw new Error(`${errors.length} errors occurred while updating dist-tags.`);
  }
}

export async function updateDistTag(
  pkg: string,
  version: string,
  distTag: string,
  dryRun: boolean,
  isRetry = false
): Promise<Error | null> {
  const cmd = `pnpm dist-tag add ${pkg}@${version} ${distTag}`;

  // pnpm's dist-tag command has no --dry-run flag, so a dry run skips
  // executing it entirely rather than passing an unsupported flag through.
  if (dryRun) {
    console.log(styleText('gray', `\t[dry-run] would run: ${cmd}`));
    return null;
  }

  try {
    await exec({ cmd, condense: true });
  } catch (e) {
    const error = !(e instanceof Error) ? new Error(e as string) : e;
    // A GitHub Actions OIDC token can go stale between packages in a long
    // promote loop; one retry is enough to get a fresh one negotiated.
    if (!isRetry && error.message.includes('E401')) {
      return updateDistTag(pkg, version, distTag, dryRun, true);
    }
    return error;
  }

  return null;
}
