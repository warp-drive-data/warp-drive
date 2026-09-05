import { styleText } from 'node:util';

import { exec } from '../../../utils/cmd.ts';
import { APPLIED_STRATEGY, Package } from '../../../utils/package.ts';
// import { updateDistTag } from '../../promote';

export async function publishPackages(
  config: Map<string, string | number | boolean | null>,
  packages: Map<string, Package>,
  strategy: Map<string, APPLIED_STRATEGY>
) {
  const dryRun = config.get('dry_run') as boolean;
  let publishCount = 0;
  const errors: Error[] = [];
  for (const [, strat] of strategy) {
    const pkg = packages.get(strat.name)!;
    let error = await publishPackage(strat.distTag, pkg.tarballPath, dryRun);
    if (error) {
      console.log(
        styleText('red', `\t🚫 Error publishing ${styleText('cyan', pkg.pkgData.name)} to npm: ${error.message}`)
      );
      errors.push(error);
      continue;
    }
    publishCount++;

    // TODO - only do this if its a stable release
    // TODO - moving to OIDC breaks this, bring it back once npm adds the feature
    // if (strat.stage === 'alpha' || strat.stage === 'beta') {
    //   error = await updateDistTag(
    //     strat.name,
    //     pkg.pkgData.version,
    //     'latest',
    //     config.get('dry_run') as boolean
    //   );
    //   if (error) {
    //     console.log(
    //       styleText('red',
    //         `\t🚫 Error updating dist-tag for ${styleText('cyan', pkg.pkgData.name)} to latest: ${error.message}`
    //       )
    //     );
    //     errors.push(error);
    //   }
    // }

    if (strat.mirrorPublish) {
      error = await publishPackage(strat.distTag, pkg.mirrorTarballPath, dryRun);
      if (error) {
        console.log(
          styleText(
            'red',
            `\t🚫 Error publishing ${styleText('cyan', pkg.pkgData.name)} <Mirror Package> to npm: ${error.message}`
          )
        );
        errors.push(error);
        continue;
      }
      publishCount++;

      // TODO - only do this if its a stable release
      // TODO - moving to OIDC breaks this, bring it back once npm adds the feature
      // if (strat.stage === 'alpha' || strat.stage === 'beta') {
      //   error = await updateDistTag(
      //     strat.mirrorPublishTo,
      //     pkg.pkgData.version,
      //     'latest',
      //     config.get('dry_run') as boolean
      //   );
      //   if (error) {
      //     console.log(
      //       styleText('red',
      //         `\t🚫 Error updating dist-tag for ${styleText('cyan', pkg.pkgData.name)} <Mirror Package> to latest: ${error.message}`
      //       )
      //     );
      //     errors.push(error);
      //   }
      // }
    }
    if (strat.typesPublish) {
      error = await publishPackage(strat.distTag, pkg.typesTarballPath, dryRun);
      if (error) {
        console.log(
          styleText(
            'red',
            `\t🚫 Error publishing ${styleText('cyan', pkg.pkgData.name)} <Types Package> to npm: ${error.message}`
          )
        );
        errors.push(error);
        continue;
      }
      publishCount++;

      // TODO - only do this if its a stable release
      // TODO - moving to OIDC breaks this, bring it back once npm adds the feature
      // if (strat.stage === 'alpha' || strat.stage === 'beta') {
      //   error = await updateDistTag(
      //     strat.typesPublishTo,
      //     pkg.pkgData.version,
      //     'latest',
      //     config.get('dry_run') as boolean
      //   );
      //   if (error) {
      //     console.log(
      //       styleText('red', `\t🚫 Error updating dist-tag for ${styleText('cyan', pkg.pkgData.name)} to latest: ${error.message}`)
      //     );
      //     errors.push(error);
      //   }
      // }
    }
  }

  console.log(
    `✅ ` + styleText('cyan', `published ${styleText('greenBright', String(publishCount))} 📦 packages to npm`)
  );
  if (errors.length > 0) {
    console.log(styleText('red', `🚫 ${errors.length} errors occurred while publishing packages to npm`));
    for (const error of errors) {
      console.log(styleText('red', error.message));
    }
    throw new Error(`${errors.length} errors occurred while publishing packages to npm.`);
  }
}

async function publishPackage(
  distTag: string,
  tarball: string,
  dryRun: boolean,
  isRetry = false
): Promise<Error | null> {
  let cmd = `pnpm publish ${tarball} --tag=${distTag} --access=public --provenance --no-git-checks`;

  if (dryRun) {
    cmd += ' --dry-run';
  }

  try {
    await exec({ cmd, condense: true });
  } catch (e: unknown) {
    const error = !(e instanceof Error) ? new Error(e as string) : e;
    // A GitHub Actions OIDC token can go stale between packages in a long
    // publish loop; one retry is enough to get a fresh one negotiated.
    if (!isRetry && error.message.includes('E401')) {
      return publishPackage(distTag, tarball, dryRun, true);
    }
    return error;
  }

  return null;
}
