import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { styleText } from 'node:util';

import { printHelpDocs } from '../../help/docs.ts';
import { exec } from '../../utils/cmd.ts';
import { bootstrap_flags_config } from '../../utils/flags-config.ts';
import { gatherPackages, loadStrategy, Package } from '../../utils/package.ts';
import { parseRawFlags } from '../../utils/parse-args.ts';

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
 * Scope: only checks the primary name of each package.json under the
 * monorepo's package roots. It does not compute or check the derived
 * mirror/types publish names (e.g. `ember-data-mirror`, `ember-data-types`)
 * that the real publish strategy generates for some packages -- those are
 * synthesized at publish time, not present as their own package.json, and
 * are far less likely to be the first thing published for a brand-new
 * package. If one of those ever needs bootstrapping, do it manually.
 */

type RegistryStatus =
  | { kind: 'never-published' }
  | { kind: 'published'; latest: string }
  | { kind: 'lookup-error'; message: string };

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

async function publishPlaceholder(pkg: Package, dryRun: boolean): Promise<Error | null> {
  if (dryRun) {
    console.log(styleText('gray', `\t[dry-run] would publish a 0.0.0 placeholder for ${pkg.pkgData.name}`));
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
      name: pkg.pkgData.name,
      version: '0.0.0',
      private: false,
      description: `Reserved placeholder for ${pkg.pkgData.name}, published ahead of its first real release from https://github.com/warp-drive-data/warp-drive.`,
      license: pkg.pkgData.license ?? 'MIT',
      repository: pkg.pkgData.repository,
    };
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify(placeholderPkg, null, 2));
    fs.writeFileSync(path.join(tmpDir, 'index.js'), '// placeholder release, see README\nmodule.exports = {};\n');
    fs.writeFileSync(
      path.join(tmpDir, 'README.md'),
      `# ${pkg.pkgData.name}\n\nThis \`0.0.0\` version is a placeholder published only to reserve this package name ahead of its first real release from [warp-drive-data/warp-drive](https://github.com/warp-drive-data/warp-drive).\n`
    );
    // Written directly with the resolved secret value (not a template) into a
    // throwaway directory outside the repo -- never committed, never printed.
    fs.writeFileSync(path.join(tmpDir, '.npmrc'), `//registry.npmjs.org/:_authToken=${token}\n`);

    await exec({ cmd: `pnpm publish --tag=latest --access=public --no-git-checks`, cwd: tmpDir, condense: true });
    return null;
  } catch (e: unknown) {
    return !(e instanceof Error) ? new Error(e as string) : e;
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

  const strategy = await loadStrategy();
  const packages = await gatherPackages(strategy.config);

  const publicPackages = Array.from(packages.values()).filter((pkg) => !pkg.pkgData.private);

  console.log(styleText('cyan', `Scanning ${String(publicPackages.length)} public packages for registry status...`));

  const reserved: string[] = [];
  const stillNeedsOidc: string[] = [];
  const errors: { name: string; message: string }[] = [];
  const ok: string[] = [];

  for (const pkg of publicPackages) {
    const name = pkg.pkgData.name;
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
    const error = await publishPlaceholder(pkg, dryRun);
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
