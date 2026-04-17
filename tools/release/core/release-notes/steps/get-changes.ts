import chalk from 'chalk';
import { exec } from '../../../utils/cmd.ts';
import { Package, RawStrategyConfig } from '../../../utils/package.ts';
import path from 'path';

export const Committers = Symbol('Committers');
export type Entry = { packages: string[]; description: string; committer: string };
export interface LernaOutput {
  [Committers]: Map<string, string>;
  [key: string]: Map<string, Entry>;
}
export type LernaChangeset = {
  data: LernaOutput;
  byPackage: Record<string, Record<string, Map<string, Entry>>>;
};
export type VersionedLernaChangeset = LernaChangeset & {
  tag: string;
  date: string;
};

const IgnoredPackages = new Set(['private-build-infra']);

// e.g. match lines ending in "asljasdfjh ([@runspired](https://github.com/runspired))""
// No backreference: bot html_url uses /apps/<name> rather than /<login>, so \1 would never match bots.
const CommitterRegEx = /.*\s\(?\[@([a-zA-Z0-9\-\[\]]+)\]\(https:\/\/github\.com\/[^)]+\)\)?$/;

function keyForLabel(label: string, strategy: RawStrategyConfig): string {
  const labelKey = strategy.changelog?.collapseLabels?.labels.some((v) => v === label);
  return labelKey ? strategy.changelog!.collapseLabels!.title : label;
}

function packagesBySubPath(strategy: RawStrategyConfig, packages: Map<string, Package>): Map<string, Package> {
  const subPathMap = new Map<string, Package>();
  const changelogRoots = strategy.changelogRoots || strategy.packageRoots;
  const changelogPaths = changelogRoots.map((v) => v.replace('/*', ''));

  for (const [, pkg] of packages) {
    if (pkg.pkgData.name === 'root') {
      subPathMap.set('root', pkg);
      continue;
    }
    if (pkg.pkgData.name === '@ember-data/json-api') {
      // we push everything to @warp-drive/json-api
      continue;
    }
    let relative = path.dirname(path.relative(process.cwd(), pkg.filePath));
    for (const root of changelogPaths) {
      if (relative.startsWith(root + '/')) {
        const shortPath = relative.substring(root.length + 1);
        if (subPathMap.has(shortPath)) {
          console.error(`Duplicate subpath: ${shortPath}`);
          process.exit(1);
        }
        relative = shortPath;
        break;
      }
    }
    subPathMap.set(relative, pkg);
  }

  const mappings = strategy.changelog?.mappings || {};
  Object.keys(mappings).forEach((mapping) => {
    const mapped = mappings[mapping];
    if (mapped === null) {
      subPathMap.set(mapping, packages.get('root')!);
      return;
    }
    const pkg = packages.get(mapped);
    if (!pkg) {
      throw new Error(`Could not find package for mapping: ${mapping}`);
    }
    subPathMap.set(mapping, pkg);
  });

  return subPathMap;
}

function packageForSubPath(subPath: string, packages: Map<string, Package>): string | null {
  if (IgnoredPackages.has(subPath)) {
    return null;
  }
  const pkg = packages.get(subPath);
  if (pkg) {
    return pkg.pkgData.name;
  }
  throw new Error(`Could not find package for subpath: ${subPath}`);
}

function extractLoggedEntry(
  currentEntry: Entry,
  data: LernaOutput,
  byPackage: Record<string, Record<string, Map<string, Entry>>>,
  subPathMap: Map<string, Package>,
  currentSection: string
): void {
  const PRMatches = currentEntry!.description.match(/^\[#(\d+)/);
  const PRNumber = PRMatches![1];

  // e.g. ([@runspired](https://github.com/runspired))
  const committerMatches = currentEntry!.description.match(CommitterRegEx);
  currentEntry!.committer = committerMatches?.[1] ?? '';

  (data[currentSection] as Map<string, Entry>).set(PRNumber, currentEntry as Entry);

  currentEntry?.packages.forEach((subPath) => {
    console.log(`\tsubPath: ${chalk.cyan(subPath)}`);
    const pkg = packageForSubPath(subPath, subPathMap);

    if (pkg) {
      byPackage[pkg] = byPackage[pkg] || {};
      byPackage[pkg][currentSection] = byPackage[pkg][currentSection] || new Map();
      byPackage[pkg][currentSection].set(PRNumber, currentEntry as Entry);
    }
  });
}

const VERSION_HEADER_RE = /^## (.+?)(?:\s+\((\d{4}-\d{2}-\d{2})\))?$/;
// Strips pre-release suffix: "v5.8.0-alpha.3" → "v5.8.0", "v5.8.0" → "v5.8.0", "Unreleased" → "Unreleased"
const BASE_VERSION_RE = /^(v\d+\.\d+\.\d+)/;

function baseVersion(tag: string): string {
  const m = tag.match(BASE_VERSION_RE);
  return m ? m[1] : tag;
}

function mergeInto(target: VersionedLernaChangeset, source: VersionedLernaChangeset): void {
  for (const [k, v] of source.data[Committers]) {
    target.data[Committers].set(k, v);
  }
  for (const [section, entries] of Object.entries(source.data)) {
    target.data[section] = target.data[section] || new Map();
    for (const [pr, entry] of entries as Map<string, Entry>) {
      (target.data[section] as Map<string, Entry>).set(pr, entry);
    }
  }
  for (const [pkg, sections] of Object.entries(source.byPackage)) {
    target.byPackage[pkg] = target.byPackage[pkg] || {};
    for (const [section, entries] of Object.entries(sections)) {
      target.byPackage[pkg][section] = target.byPackage[pkg][section] || new Map();
      for (const [pr, entry] of entries) {
        target.byPackage[pkg][section].set(pr, entry);
      }
    }
  }
}

function collapsePreReleases(changesets: VersionedLernaChangeset[]): VersionedLernaChangeset[] {
  // changesets is newest→oldest; the first entry in each group is the most recent
  // (stable release if it exists, otherwise latest pre-release)
  const groups = new Map<string, VersionedLernaChangeset>();
  const order: string[] = [];

  for (const cs of changesets) {
    const base = baseVersion(cs.tag);
    if (!groups.has(base)) {
      // Normalise the tag to the base version on first encounter
      groups.set(base, { ...cs, tag: base });
      order.push(base);
    } else {
      mergeInto(groups.get(base)!, cs);
    }
  }

  return order.map((base) => groups.get(base)!);
}

function freshOutput(): { data: LernaOutput; byPackage: Record<string, Record<string, Map<string, Entry>>> } {
  return { data: { [Committers]: new Map() }, byPackage: {} };
}

function parseLernaOutput(
  markdown: string,
  strategy: RawStrategyConfig,
  packages: Map<string, Package>
): VersionedLernaChangeset[] {
  // uncomment this to see lerna's markdown output if needed to debug
  // console.log(markdown);
  const subPathMap = packagesBySubPath(strategy, packages);
  const results: VersionedLernaChangeset[] = [];

  let currentTag = '';
  let currentDate = '';
  let { data, byPackage } = freshOutput();

  let isParsingCommitters = false;
  let isParsingSection = false;
  let currentSection = '';
  let currentEntry: Entry | null = null;

  function flushVersion() {
    if (currentTag) {
      results.push({ tag: currentTag, date: currentDate, data, byPackage });
    }
  }

  for (const line of lines(markdown)) {
    const versionMatch = line.match(VERSION_HEADER_RE);
    if (versionMatch) {
      flushVersion();
      currentTag = versionMatch[1];
      currentDate = versionMatch[2] ?? '';
      ({ data, byPackage } = freshOutput());
      isParsingSection = false;
      isParsingCommitters = false;
      currentSection = '';
      currentEntry = null;
      continue;
    }

    if (isParsingSection) {
      if (line === '') {
        isParsingSection = false;
        currentSection = '';
      } else {
        if (line.startsWith('* [#')) {
          currentEntry = {
            packages: ['Other'],
            description: line.substring(2),
            committer: '',
          };
          extractLoggedEntry(currentEntry, data, byPackage, subPathMap, currentSection);
        } else if (line.startsWith('* ')) {
          const packages = line
            .substring(2)
            .split(',')
            .map((v) => v.trim().replaceAll('`', ''));
          currentEntry = {
            packages,
            description: '',
            committer: '',
          };
        } else if (line.startsWith('  * ')) {
          currentEntry = structuredClone(currentEntry!);
          currentEntry!.description = line.substring(4);
          extractLoggedEntry(currentEntry, data, byPackage, subPathMap, currentSection);
        } else {
          isParsingSection = false;
          currentSection = '';
          currentEntry = null;
        }
      }
    } else if (isParsingCommitters) {
      if (line === '') {
        isParsingCommitters = false;
      } else {
        const committerMatches = line.match(CommitterRegEx);
        if (!committerMatches) continue;
        const committer = committerMatches[1];
        data[Committers].set(committer, line.substring(2));
      }
    } else if (line.startsWith('#### ')) {
      isParsingCommitters = false;
      isParsingSection = false;
      currentEntry = null;
      if (line.startsWith('#### Committers:')) {
        currentSection = 'Committers';
        isParsingCommitters = true;
      } else {
        currentSection = keyForLabel(line.substring(5), strategy);
        data[currentSection] = data[currentSection] || new Map();
        isParsingSection = true;
      }
    }
  }

  flushVersion();
  return collapsePreReleases(results);
}

function* lines(markdown: string): Generator<string> {
  yield* markdown.split('\n');
}

export async function getChanges(
  strategy: RawStrategyConfig,
  packages: Map<string, Package>,
  fromTag: string
): Promise<VersionedLernaChangeset[]> {
  const changelogMarkdown = await exec(['sh', '-c', `pnpm exec lerna-changelog --from=${fromTag}`]);
  return parseLernaOutput(changelogMarkdown, strategy, packages);
}
