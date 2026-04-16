import { Package, RawStrategyConfig, STRATEGY } from '../../../utils/package.ts';
import { AppliedStrategy } from '../../publish/steps/generate-strategy.ts';
import { Committers, Entry, LernaChangeset } from './get-changes.ts';
import path from 'path';
import chalk from 'chalk';
import { BunFile } from 'bun';

function findInsertionPoint(lines: string[], version: string) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith(`## ${version}`)) {
      return i;
    }
  }
  return 2;
}

function buildText(
  newTag: string,
  date: string,
  strategy: RawStrategyConfig,
  changes: Record<string, Map<string, Entry>>,
  committerStrings: Map<string, string>
): string[] {
  const formattedDate = date;
  const committers = new Set<string>();

  const lines = [`## ${newTag} (${formattedDate})`, ''];
  const order = strategy.changelog?.labelOrder || [];
  const seen = new Set<string>();

  for (const section of order) {
    const entries = changes[section];
    if (!entries) {
      continue;
    }

    lines.push(`#### ${section}`, '');
    for (const [pr, entry] of entries) {
      committers.add(entry.committer);
      lines.push(`* ${entry.description}`);
    }
    lines.push('');
    seen.add(section);
  }

  for (const [section, entries] of Object.entries(changes)) {
    if (section === 'Committers' || seen.has(section)) {
      continue;
    }

    lines.push(`#### ${section}`, '');
    for (const [pr, entry] of entries) {
      committers.add(entry.committer);
      lines.push(`* ${entry.description}`);
    }
    lines.push('');
  }

  lines.push(`#### Committers: (${committers.size})`, '');
  committers.forEach((committer) => {
    // e.g. `* [@runspired](https://github.com/runspired)`
    lines.push(committerStrings.get(committer)!);
  });
  lines.push('');

  return lines;
}

export async function updateChangelogs(
  fromTag: string,
  toTag: string,
  date: string,
  newChanges: LernaChangeset,
  config: Map<string, string | number | boolean | null>,
  strategy: RawStrategyConfig,
  packages: Map<string, Package>
): Promise<BunFile[]> {
  const file = Bun.file('./CHANGELOG.md');
  const mainChangelog = await file.text();
  const lines = mainChangelog.split('\n');
  const newLines = buildText(toTag, date, strategy, newChanges.data, newChanges.data[Committers]);
  const insertionPoint = findInsertionPoint(lines, fromTag);
  lines.splice(insertionPoint, 0, ...newLines);
  await Bun.write(file, lines.join('\n'));
  console.log(`\t✅ Updated Primary Changelog`);
  const changedFiles = [file];

  for (const [pkgName, changes] of Object.entries(newChanges.byPackage)) {
    if (pkgName === 'root') {
      continue;
    }

    const pkg = packages.get(pkgName);
    if (!pkg) {
      throw new Error(`Could not find package for name: ${pkgName}`);
    }
    const changelogFile = Bun.file(path.join(path.dirname(pkg.filePath), 'CHANGELOG.md'));
    const exists = await changelogFile.exists();
    const newLines = buildText(toTag, date, strategy, changes, newChanges.data[Committers]);
    changedFiles.push(changelogFile);

    let changelogLines: string[] = [];
    if (!exists) {
      changelogLines = [
        `# ${pkg.pkgData.name} Changelog`,
        '',
        `For the full project changelog see [https://github.com/warp-drive-data/warp-drive/blob/main/CHANGELOG.md](https://github.com/warp-drive-data/warp-drive/blob/main/CHANGELOG.md)`,
        '',
        ...newLines,
        '',
      ];
    } else {
      changelogLines = (await changelogFile.text()).split('\n');
      const insertionPoint = findInsertionPoint(changelogLines, fromTag);
      changelogLines.splice(insertionPoint, 0, ...newLines);
    }

    await Bun.write(changelogFile, changelogLines.join('\n'));
    console.log(
      exists
        ? `\t✅ Updated ${chalk.cyan(pkg.pkgData.name)} Changelog`
        : `\t✅ Created ${chalk.cyan(pkg.pkgData.name)} Changelog`
    );
  }

  return changedFiles;
}
