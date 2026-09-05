import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { styleText } from 'node:util';

import { printHelpDocs } from '../../help/docs.ts';
import { exec } from '../../utils/cmd.ts';
import { bootstrap_flags_config } from '../../utils/flags-config.ts';
import { gatherPackages, loadStrategy, Package, STRATEGY } from '../../utils/package.ts';
import { parseRawFlags } from '../../utils/parse-args.ts';
import {
  getMirrorAndTypesFlags,
  getMirrorPackageName,
  getTypesPackageName,
} from '../publish/steps/generate-strategy.ts';

/**
 * npm's Trusted Publishing (OIDC) can only be configured for a package that
 * already exists on the registry -- there's nowhere on npmjs.com to attach a
 * trusted-publisher config to a name nobody has published yet. That makes
 * the very first publish of a brand-new package in this monorepo a chicken-
 * and-egg problem: our release pipeline is OIDC-only (see publish-packages.ts),
 * so it cannot publish a package that has no npm history at all.
 *
 * This command breaks that cycle: it scans every public package.json in the
 * monorepo, finds ones that have never been published, and publishes a
 * throwaway `0.0.0` placeholder for each using a classic (non-OIDC) npm
 * token -- just enough for the package name to exist on the registry so a
 * human can then configure Trusted Publishing for it on npmjs.com. It also
 * flags any package that's already reserved this way (registry `latest` is
 * still `0.0.0`) as a reminder that it likely still needs that configuration
 * step before its real release will succeed.
 *
 * This intentionally does NOT reuse publishPackage() from publish-packages.ts
 * -- that path is OIDC-only by design, and this is the one place in the
 * release tooling that deliberately is not.
 *
 * Also checks the derived mirror/types names (e.g. `ember-data-mirror`,
 * `ember-data-types`) for any package whose release strategy rule enables
 * them, using the same getMirrorAndTypesFlags()/getMirrorPackageName()/
 * getTypesPackageName() helpers applyStrategy() uses for a real publish --
 * those names aren't their own package.json in the repo, so they'd
 * otherwise be invisible to a scan of package.json files alone.
 */

type RegistryStatus =
  | { kind: 'never-published' }
  | { kind: 'published'; latest: string }
  | { kind: 'lookup-error'; message: string };

type BootstrapTarget = {
  /** the actual npm package name to check/reserve on the registry */
  name: string;
  /** the repo package.json this name was derived from, for placeholder metadata (license, repository) */
  sourcePkg: Package;
};

/**
 * Expands each public package into every npm package name its release
 * strategy rule says should exist: its own primary name, and (when enabled
 * for that package) its mirror and/or types publish names.
 */
function computeBootstrapTargets(publicPackages: Package[], strategy: STRATEGY): BootstrapTarget[] {
  const targets: BootstrapTarget[] = [];
  for (const pkg of publicPackages) {
    const name = pkg.pkgData.name;
    targets.push({ name, sourcePkg: pkg });

    const { mirrorPublish, typesPublish } = getMirrorAndTypesFlags(name, false, strategy);
    if (mirrorPublish) {
      targets.push({ name: getMirrorPackageName(name), sourcePkg: pkg });
    }
    if (typesPublish) {
      targets.push({ name: getTypesPackageName(name), sourcePkg: pkg });
    }
  }
  return targets;
}

async function checkRegistryStatus(name: string): Promise<RegistryStatus> {
  try {
    const out = await exec({ cmd: `pnpm view ${name} --json`, silent: true });
    const data = JSON.parse(out) as { 'dist-tags'?: Record<string, string> };
    return { kind: 'published', latest: data['dist-tags']?.latest ?? 'unknown' };
  } catch (e: unknown) {
    const err = e as (Error & { errText?: string }) | string;
    const text = typeof err === 'string' ? err : (err.errText ?? err.message ?? '');
    if (text.includes('ERR_PNPM_FETCH_404') || text.includes('Not Found - 404')) {
      return { kind: 'never-published' };
    }
    return { kind: 'lookup-error', message: typeof err === 'string' ? err : err.message };
  }
}

/**
 * npm tokens expire after 90 days, and (unless the token is the
 * 2FA-exempt "Automation" type) publishing still requires a fresh
 * one-time password. Both show up as an auth failure from `pnpm
 * publish`, so we classify the actual registry error text (not just
 * the exit code -- see the non-condensed exec() call below, which is
 * what makes that text available at all) to tell the operator which
 * of the two it actually is, rather than a generic "publish failed".
 */
function describeAuthFailure(name: string, registryErrorText: string): string {
  const text = registryErrorText.toLowerCase();
  if (text.includes('one-time pass') || text.includes('eotp')) {
    return `Publishing ${name} requires a 2FA one-time password. Re-run this workflow with the "otp" input set to your authenticator app's current code.`;
  }
  if (text.includes('401') || text.includes('unable to authenticate') || text.includes('e403')) {
    return `Publishing ${name} failed to authenticate. NPM_BOOTSTRAP_TOKEN may have expired (npm tokens expire after 90 days) or been revoked -- generate a new token on npmjs.com and update the NPM_BOOTSTRAP_TOKEN secret.`;
  }
  return `Publishing ${name} failed: ${registryErrorText}`;
}

async function publishPlaceholder(target: BootstrapTarget, dryRun: boolean, otp: string): Promise<Error | null> {
  const { name, sourcePkg } = target;

  if (dryRun) {
    console.log(styleText('gray', `\t[dry-run] would publish a 0.0.0 placeholder for ${name}`));
    return null;
  }

  const token = process.env.NPM_BOOTSTRAP_TOKEN;
  if (!token) {
    return new Error(
      'NPM_BOOTSTRAP_TOKEN is not set in ENV -- required to publish a placeholder for a brand-new package (OIDC cannot be used until the name exists on the registry).'
    );
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'warp-drive-bootstrap-'));
  try {
    const placeholderPkg = {
      name,
      version: '0.0.0',
      private: false,
      description: `Reserved placeholder for ${name}, published ahead of its first real release from https://github.com/warp-drive-data/warp-drive.`,
      license: sourcePkg.pkgData.license ?? 'MIT',
      repository: sourcePkg.pkgData.repository,
    };
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify(placeholderPkg, null, 2));
    fs.writeFileSync(path.join(tmpDir, 'index.js'), '// placeholder release, see README\nmodule.exports = {};\n');
    fs.writeFileSync(
      path.join(tmpDir, 'README.md'),
      `# ${name}\n\nThis \`0.0.0\` version is a placeholder published only to reserve this package name ahead of its first real release from [warp-drive-data/warp-drive](https://github.com/warp-drive-data/warp-drive).\n`
    );
    // Written directly with the resolved secret value (not a template) into a
    // throwaway directory outside the repo -- never committed, never printed.
    fs.writeFileSync(path.join(tmpDir, '.npmrc'), `//registry.npmjs.org/:_authToken=${token}\n`);

    let cmd = `pnpm publish --tag=latest --access=public --no-git-checks`;
    if (otp) {
      cmd += ` --otp=${otp}`;
    }

    // Deliberately not `condense: true`: that mode discards stderr on
    // failure (exec() just throws the bare exit code), which would make
    // it impossible to tell an expired token apart from a missing OTP.
    await exec({ cmd, cwd: tmpDir });
    return null;
  } catch (e: unknown) {
    const error = e as (Error & { errText?: string }) | number;
    const registryErrorText =
      typeof error === 'number' ? `exit code ${String(error)}` : (error.errText ?? error.message);
    return new Error(describeAuthFailure(name, registryErrorText));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function writeStepSummary(lines: string[]) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  fs.appendFileSync(summaryPath, lines.join('\n') + '\n');
}

export async function bootstrapNewPackages(args: string[]) {
  const config = await parseRawFlags(args, bootstrap_flags_config);

  if (config.full.get('help')) {
    return printHelpDocs(args);
  }

  const dryRun = config.full.get('dry_run') as boolean;
  const otp = (config.full.get('otp') as string | null) ?? '';

  const strategy = await loadStrategy();
  const packages = await gatherPackages(strategy.config);

  const publicPackages = Array.from(packages.values()).filter((pkg) => !pkg.pkgData.private);
  const targets = computeBootstrapTargets(publicPackages, strategy);

  console.log(
    styleText(
      'cyan',
      `Scanning ${String(targets.length)} public package names (including mirror/types variants) for registry status...`
    )
  );

  const reserved: string[] = [];
  const stillNeedsOidc: string[] = [];
  const errors: { name: string; message: string }[] = [];
  const ok: string[] = [];

  for (const target of targets) {
    const { name } = target;
    const status = await checkRegistryStatus(name);

    if (status.kind === 'lookup-error') {
      console.log(styleText('red', `\t🚫 Error checking registry status for ${name}: ${status.message}`));
      errors.push({ name, message: status.message });
      continue;
    }

    if (status.kind === 'published') {
      if (status.latest === '0.0.0') {
        console.log(styleText('yellow', `\t⚠️  ${name} is published but still at placeholder version 0.0.0`));
        stillNeedsOidc.push(name);
      } else {
        ok.push(name);
      }
      continue;
    }

    // never-published
    console.log(styleText('cyan', `\t📦 ${name} has never been published, reserving with a 0.0.0 placeholder...`));
    const error = await publishPlaceholder(target, dryRun, otp);
    if (error) {
      console.log(styleText('red', `\t🚫 Error publishing placeholder for ${name}: ${error.message}`));
      errors.push({ name, message: error.message });
      continue;
    }
    if (!dryRun) {
      console.log(styleText('green', `\t✅ Reserved ${name}@0.0.0`));
    }
    reserved.push(name);
  }

  console.log(
    `\n✅ ` +
      styleText(
        'cyan',
        `${String(ok.length)} package(s) already properly published, ${String(reserved.length)} newly reserved, ${String(stillNeedsOidc.length)} still need attention, ${String(errors.length)} error(s)`
      )
  );

  const summary: string[] = ['## Bootstrap New Packages Report', ''];

  if (reserved.length) {
    summary.push(
      `### 🆕 Newly reserved (${dryRun ? 'would reserve' : 'published'} \`0.0.0\`) -- needs Trusted Publishing configured on npmjs.com now`,
      ...reserved.map((name) => `- \`${name}\``),
      ''
    );
  }
  if (stillNeedsOidc.length) {
    summary.push(
      '### ⚠️ Already reserved, still at `0.0.0` -- likely still needs Trusted Publishing configured',
      ...stillNeedsOidc.map((name) => `- \`${name}\``),
      ''
    );
  }
  if (errors.length) {
    summary.push('### 🚫 Errors', ...errors.map((e) => `- \`${e.name}\`: ${e.message}`), '');
  }
  if (!reserved.length && !stillNeedsOidc.length && !errors.length) {
    summary.push('Every public package is already published with a real `latest` version. Nothing to do.', '');
  }

  writeStepSummary(summary);

  if (errors.length > 0) {
    throw new Error(`${String(errors.length)} error(s) occurred while bootstrapping new packages.`);
  }
}
