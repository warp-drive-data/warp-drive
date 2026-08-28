import path from 'path';
import { existsSync, globSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import fm from 'front-matter';

const DefaultOpenGroups: string[] = [];
const AlwaysOpenGroups: string[] = [];

function segmentToTitle(segment: string, prevSegment: string | null) {
  if (segment === 'index.md') {
    if (!prevSegment) return 'Introduction';
    segment = prevSegment;
  }
  const value = segment.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1));
  if (!isNaN(Number(value[0]))) {
    value.shift();
  }
  const result = value.join(' ').replace('.md', '');

  return result === 'Index' ? 'Introduction' : result;
}

interface WarpDriveFrontMatter {
  title?: string;
  draft?: boolean;
}

interface DirMeta {
  title?: string;
  collapsed?: boolean;
  draft?: boolean;
  /** Ordered list of child slugs (filenames without .md, or directory names). Unlisted items sort alphabetically after listed ones. */
  items?: string[];
  /**
   * Per-file frontmatter for markdown files in this directory, keyed by filename without `.md`
   * (e.g. "index", "fetch-and-cache-data"). Lets content (e.g. agent skills) keep its markdown
   * bodies free of YAML frontmatter that might collide with tool-specific frontmatter
   * conventions (Claude Skills, Cursor rules, etc.), while still supplying the same
   * title/draft metadata the site compiler reads — structured once per directory instead of
   * one sidecar file per markdown file.
   */
  files?: Record<string, WarpDriveFrontMatter>;
  /**
   * Filename (without `.md`) of a file in this directory that should be published as this
   * directory's `index.md` on the website, in place of the real `index.md` — used when the
   * real `index.md` is agent-facing content (see `files.index.draft`) and a separate
   * human-facing overview page should be what's actually visible at that route.
   */
  webIndex?: string;
}

/**
 * Resolves a markdown file's frontmatter. If the file's directory `_meta.json` declares a
 * `files` entry for it, that entry is used instead of YAML frontmatter parsed from the file
 * itself.
 */
function readFrontMatter(
  dirMeta: Map<string, DirMeta>,
  fileDir: string,
  baseName: string,
  text: string
): WarpDriveFrontMatter {
  const filesMeta = dirMeta.get(fileDir)?.files;
  if (filesMeta && baseName in filesMeta) {
    return filesMeta[baseName];
  }
  return fm<WarpDriveFrontMatter>(text).attributes;
}

/** Loads every `_meta.json` under a content directory, keyed by forward-slash dir path (root is `''`). */
function loadDirMeta(contentDirPath: string): Map<string, DirMeta> {
  const metaFiles = globSync('**/_meta.json', { cwd: contentDirPath });
  const dirMeta = new Map<string, DirMeta>();
  for (const metaFile of metaFiles) {
    const dirPath = path.dirname(metaFile);
    const key = dirPath === '.' ? '' : normPath(dirPath);
    dirMeta.set(key, JSON.parse(readFileSync(path.join(contentDirPath, metaFile), 'utf-8')) as DirMeta);
  }
  return dirMeta;
}

/**
 * Finalizes a synced content directory for website publishing: removes any file or directory
 * flagged `draft` (via `_meta.json`, or real YAML frontmatter) so it's never built into the
 * site, then applies each directory's `webIndex` (if set) by moving that file over `index.md`.
 * Content consumed directly from the npm package (e.g. by an agent) is untouched — this only
 * mutates the copy synced into `docs.warp-drive.io/`.
 */
export function finalizeSyncedContent(contentDirPath: string) {
  const dirMeta = loadDirMeta(contentDirPath);

  for (const [dir, meta] of dirMeta) {
    if (dir && meta.draft) {
      rmSync(path.join(contentDirPath, dir), { recursive: true, force: true });
    }
  }

  for (const filepath of globSync('**/*.md', { cwd: contentDirPath })) {
    const fullPath = path.join(contentDirPath, filepath);
    if (!existsSync(fullPath)) continue;

    const rawDir = normPath(path.dirname(filepath));
    const dir = rawDir === '.' ? '' : rawDir;
    const baseName = path.basename(filepath, '.md');
    const isDraft = readFrontMatter(dirMeta, dir, baseName, readFileSync(fullPath, 'utf-8')).draft;
    if (isDraft) {
      rmSync(fullPath, { force: true });
    }
  }

  for (const [dir, meta] of dirMeta) {
    if (!meta.webIndex) continue;
    const dirFullPath = path.join(contentDirPath, dir);
    const sourceFile = path.join(dirFullPath, `${meta.webIndex}.md`);
    if (existsSync(sourceFile)) {
      rmSync(path.join(dirFullPath, 'index.md'), { force: true });
      renameSync(sourceFile, path.join(dirFullPath, 'index.md'));
    }
  }
}

interface GuideGroup {
  text: string;
  path: string;
  slug: string;
  /** Items list from this directory's _meta.json, used to sort this group's children. */
  orderedItems?: string[];
  collapsed: boolean | null;
  items: Record<string, GuideGroup>;
  link?: string;
}

function normPath(p: string): string {
  return p.split(path.sep).join('/');
}

interface ContentStructureOptions {
  /** name of the directory under docs.warp-drive.io/ holding the synced content, e.g. 'guides' or 'skills' */
  dirName: string;
  /**
   * Guides wraps its root `index.md` in a synthetic top-level group (historically named
   * "the-manual") whose child ordering comes from a `_meta.json` at `rootIndexGroup.slug`.
   * Omit for content (e.g. skills) whose root `index.md` is just a landing page and should not
   * appear in the generated sidebar tree.
   */
  rootIndexGroup?: { slug: string; fallbackTitle: string };
}

export async function getContentStructure(options: ContentStructureOptions) {
  const { dirName, rootIndexGroup } = options;
  const ContentDirectoryPath = path.join(__dirname, `../docs.warp-drive.io/${dirName}`);

  const dirMeta = loadDirMeta(ContentDirectoryPath);

  const glob = globSync('**/*.md', { cwd: ContentDirectoryPath });
  const groups: Record<string, GuideGroup> = {};

  for (const filepath of glob) {
    const slugPath: string[] = [];
    const fullPath = path.join(ContentDirectoryPath, filepath);
    const text = readFileSync(fullPath, 'utf-8');
    const rawFileDir = normPath(path.dirname(filepath));
    const fileDir = rawFileDir === '.' ? '' : rawFileDir;
    const baseName = path.basename(filepath, '.md');
    const frontMatter = readFrontMatter(dirMeta, fileDir, baseName, text);

    if (frontMatter.draft) {
      continue;
    }

    // Skip files whose immediate parent directory is marked draft in _meta.json
    if (fileDir !== '' && dirMeta.get(fileDir)?.draft) {
      continue;
    }

    if (filepath === 'index.md') {
      if (!rootIndexGroup) continue;

      const { slug, fallbackTitle } = rootIndexGroup;
      const rootMeta = dirMeta.get('') ?? {};
      const groupMeta = dirMeta.get(slug) ?? {};
      groups[slug] = groups[slug] ?? {
        text: rootMeta.title ?? fallbackTitle,
        path: slug,
        slug,
        orderedItems: groupMeta.items,
        collapsed: rootMeta.collapsed ?? true,
        link: `/${dirName}/index.md`,
        items: {},
      };
      Object.assign(groups[slug], {
        text: rootMeta.title ?? fallbackTitle,
        path: slug,
        slug,
        orderedItems: groupMeta.items,
        collapsed: rootMeta.collapsed ?? true,
        link: `/${dirName}/index.md`,
      });
      groups[slug].items['index.md'] = {
        text: frontMatter.title ?? 'Introduction',
        path: 'index.md',
        slug: 'index.md',
        collapsed: false,
        items: {},
        link: `/${dirName}/index.md`,
      };
      continue;
    }

    const segments = filepath.split(path.sep);
    let lastSegment = segments.pop()!;
    let isIndex = false;

    if (lastSegment === 'index.md') {
      lastSegment = segments.pop()!;

      if (!lastSegment) {
        throw new Error(`Top Level Index.md is not allowed: ${filepath}`);
      }

      isIndex = true;
    }

    let group = groups;
    let parent: GuideGroup | null = null;

    for (let i = 0; i < segments.length; i++) {
      const prevSegment = i > 0 ? segments[i - 1] : null;
      const segment = segments[i];
      slugPath.push(segment);
      const key = slugPath.join('.');
      const segmentMeta = dirMeta.get(normPath(slugPath.join(path.sep))) ?? {};
      const collapsed =
        segmentMeta.collapsed !== undefined
          ? segmentMeta.collapsed
          : AlwaysOpenGroups.includes(key)
            ? null
            : DefaultOpenGroups.includes(key)
              ? false
              : true;

      if (!group[segment]) {
        group[segment] = {
          text: segmentMeta.title ?? segmentToTitle(segment, prevSegment),
          orderedItems: segmentMeta.items,
          path: segment,
          slug: segment,
          collapsed,
          items: {},
        };
      }

      parent = group[segment];
      group = group[segment].items!;
    }

    slugPath.push(lastSegment);
    const key = slugPath.join('.');
    const realUrl = `/${dirName}/${filepath}`;

    if (!group[lastSegment]) {
      const leafMeta = dirMeta.get(normPath(slugPath.join(path.sep))) ?? {};
      group[lastSegment] = {
        text: leafMeta.title ?? segmentToTitle(lastSegment, parent ? parent.path : null),
        orderedItems: leafMeta.items,
        path: lastSegment,
        slug: lastSegment,
        collapsed:
          leafMeta.collapsed !== undefined
            ? leafMeta.collapsed
            : AlwaysOpenGroups.includes(key)
              ? null
              : DefaultOpenGroups.includes(key)
                ? false
                : true,
        items: {},
        link: realUrl,
      };
    } else {
      group[lastSegment].link = realUrl;
    }

    const leaf = group[lastSegment]!;

    if (isIndex) {
      const leafDirPath = normPath(slugPath.join(path.sep));
      const leafMeta = dirMeta.get(leafDirPath) ?? {};

      if (leafMeta.draft) continue;

      // _meta.json is authoritative for category metadata; always apply it
      if (leafMeta.title !== undefined) leaf.text = leafMeta.title;
      if (leafMeta.collapsed !== undefined) leaf.collapsed = leafMeta.collapsed;
      leaf.orderedItems = leafMeta.items;

      leaf.items['index.md'] = {
        path: 'index.md',
        slug: 'index.md',
        collapsed: false,
        text: frontMatter.title ?? 'Overview',
        link: group[lastSegment]!.link!,
        items: {},
      };
    } else {
      if (frontMatter.title) {
        leaf.text = frontMatter.title;
      }
    }
  }

  const rootMeta = dirMeta.get('') ?? {};
  const result = deepConvert(groups, rootMeta.items);
  const structure = { paths: result };

  const navJsonPath = path.join(ContentDirectoryPath, 'nav.json');
  writeFileSync(navJsonPath, JSON.stringify(structure, null, 2), 'utf-8');
  await import(navJsonPath, {
    with: { type: 'json' },
  });

  return { paths: result };
}

export async function getGuidesStructure() {
  return getContentStructure({
    dirName: 'guides',
    rootIndexGroup: { slug: 'the-manual', fallbackTitle: 'The Manual' },
  });
}

export async function getSkillsStructure() {
  return getContentStructure({ dirName: 'skills' });
}

function deepConvert(obj: Record<string, any>, orderedItems?: string[]) {
  const groups = Array.from(Object.values(obj));

  for (const group of groups) {
    if (group.items) {
      if (Object.keys(group.items).length === 0) {
        delete group.items;
        delete group.collapsed;
      } else {
        // Each group carries orderedItems from its own _meta.json for sorting its children
        group.items = deepConvert(group.items, group.orderedItems);

        if (!group.link && !group.items[0]?.items) {
          group.link = group.items[0]?.link;
        }
      }
    }
    delete group.orderedItems;
  }

  // index.md synthetic entries always first; otherwise sort by orderedItems list, then alphabetically
  groups.sort((a, b) => {
    if (a.slug === 'index.md') return -1;
    if (b.slug === 'index.md') return 1;

    if (orderedItems?.length) {
      const aKey = (a.slug ?? '').replace(/\.md$/, '');
      const bKey = (b.slug ?? '').replace(/\.md$/, '');
      const aIdx = orderedItems.indexOf(aKey);
      const bIdx = orderedItems.indexOf(bKey);
      if (aIdx === -1 && bIdx === -1) return (a.text ?? '').localeCompare(b.text ?? '');
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    }

    return (a.text ?? '').localeCompare(b.text ?? '');
  });

  for (const group of groups) {
    delete group.path;
    delete group.slug;
  }

  return groups;
}

type SidebarItem = { text: string; items?: SidebarItem[]; link?: string; collapsed?: boolean };

interface ApiNavGroupPackage {
  /** The package name, matching its `package.json` `name` field. */
  name: string;
  /** A short description of the package, shown alongside its nav entry. */
  description: string;
}

interface ApiNavGroup {
  /** The section heading shown in the sidebar. */
  text: string;
  /**
   * Packages belonging to this section, in display order. Packages not
   * listed in any group fall back to the "Frameworks" group, sorted
   * alphabetically after this group's explicitly ordered packages.
   */
  packages: ApiNavGroupPackage[];
}

const API_NAV_GROUPS = (
  JSON.parse(readFileSync(path.join(__dirname, 'nav.json'), 'utf-8')) as { groups: ApiNavGroup[] }
).groups;

function findApiNavGroup(text: string): ApiNavGroup {
  const group = API_NAV_GROUPS.find((g) => g.text === text);
  if (!group) throw new Error(`Missing "${text}" group in nav.json`);
  return group;
}

/** Sorts items by their position in `order`; unlisted items sort alphabetically after listed ones. */
function sortByPackageOrder(items: SidebarItem[], order: string[]): SidebarItem[] {
  return [...items].sort((a, b) => {
    const aIdx = order.indexOf(a.text);
    const bIdx = order.indexOf(b.text);
    if (aIdx === -1 && bIdx === -1) return a.text.localeCompare(b.text);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });
}

export function splitApiDocsSidebar(sidebar: SidebarItem[]) {
  const universalOrder = findApiNavGroup('Universal').packages.map((p) => p.name);
  const frameworksOrder = findApiNavGroup('Frameworks').packages.map((p) => p.name);
  const toolingOrder = findApiNavGroup('Tooling').packages.map((p) => p.name);
  const legacyOrder = findApiNavGroup('Legacy Packages').packages.map((p) => p.name);

  const oldPackages: SidebarItem[] = [];
  const corePackages = { text: 'Universal', items: [] as SidebarItem[] } satisfies SidebarItem;
  const frameworkPackages = { text: 'Frameworks', items: [] as SidebarItem[] } satisfies SidebarItem;
  const toolingPackages = { text: 'Tooling', items: [] as SidebarItem[] } satisfies SidebarItem;

  for (const item of sidebar) {
    if (legacyOrder.includes(item.text)) {
      oldPackages.push(item);
    } else if (toolingOrder.includes(item.text)) {
      toolingPackages.items.push(item);
    } else if (universalOrder.includes(item.text)) {
      corePackages.items.push(item);
    } else {
      // Frameworks is the catch-all: anything not explicitly listed elsewhere
      frameworkPackages.items.push(item);
    }
  }

  return {
    oldPackages: sortByPackageOrder(oldPackages, legacyOrder),
    frameworkPackages: { ...frameworkPackages, items: sortByPackageOrder(frameworkPackages.items, frameworksOrder) },
    toolingPackages: { ...toolingPackages, items: sortByPackageOrder(toolingPackages.items, toolingOrder) },
    corePackages: { ...corePackages, items: sortByPackageOrder(corePackages.items, universalOrder) },
  };
}

export function asApiDocsSidebar(o: unknown): { oldPackages: SidebarItem[]; newPackages: SidebarItem[] } {
  return o as { oldPackages: SidebarItem[]; newPackages: SidebarItem[] };
}

const HOISTED_PRIMITIVES = ['Classes', 'Variables', 'Functions'];
const FILTERED_NAV_ITEMS = ['Interfaces', 'Type Aliases'];
const META_PACKAGES = ['ember-data', 'warp-drive', 'eslint-plugin-ember-data', 'eslint-plugin-warp-drive'];

function cleanSidebarItems(items: SidebarItem[], isPrimitive = false): SidebarItem[] {
  const newItems: SidebarItem[] = [];
  let submodules: SidebarItem[] = [];

  const hoisted: SidebarItem = { text: 'exports', items: [] };

  for (const item of items) {
    if (FILTERED_NAV_ITEMS.includes(item.text)) {
      // skip filtered items
      continue;
    }

    if (HOISTED_PRIMITIVES.includes(item.text)) {
      hoisted.items!.push(...cleanSidebarItems(item.items || [], true));
      continue;
    }

    if (item.text === 'index') {
      // Packages whose primary entry point has to be pre-compiled (e.g. @warp-drive/ember,
      // whose .gts sources typedoc can't parse directly) point typedoc at the compiled
      // index.d.ts instead of a raw .ts file, and typedoc keeps that as its own "index"
      // module rather than merging it into the package root the way a raw .ts entry point
      // is. Merge it by hand so the sidebar shape matches packages that don't need this.
      hoisted.items!.push(...cleanSidebarItems(item.items || []));
      continue;
    }

    if (item.text === 'Modules') {
      // hoist modules up
      submodules = cleanSidebarItems(item.items || []);
      continue;
    }

    if (!META_PACKAGES.includes(item.text) && !item.text.startsWith('@') && !isPrimitive) {
      item.text = '/' + item.text;
    }

    if (item.items) {
      item.items = cleanSidebarItems(item.items);
    }
    newItems.push(item);
    continue;
  }

  if (hoisted.items!.length > 0) {
    // if we have hoisted items, we add them to the new items
    newItems.unshift(hoisted);
  }

  if (submodules.length === 0) {
    return newItems;
  }

  return newItems.concat(submodules);
}

// Matches the first "Defined in: <path>:<line>" typedoc emits for a page (either a plain
// path, or a markdown link `[path:line](url)` when a source link could be resolved), so we
// can point the "Edit this page" link at the original source instead of the generated .md.
const DEFINED_IN_PATTERN = /^Defined in: (?:\[([^:\]]+):\d+\]|([^:\n]+):\d+)/m;

function buildFrontmatter(content: string): string {
  const match = DEFINED_IN_PATTERN.exec(content);
  const editSource = match?.[1] ?? match?.[2];
  return `---
outline:
  level: [2, 3]${editSource ? `\neditSource: ${editSource}` : ''}
---
`;
}
const ApiDocumentation = `# API Docs\n\n`;

const TYPE_DIRS = new Set(['classes', 'functions', 'interfaces', 'type-aliases', 'variables', 'enumerations']);

const KIND_LABELS: Record<string, string> = {
  classes: 'Class',
  functions: 'Function',
  interfaces: 'Interface',
  'type-aliases': 'Type Alias',
  variables: 'Variable',
  enumerations: 'Enumeration',
};

/** The reflection kind (Function, Class, ...) for a member's own page, derived from its output directory. */
function fileKindLabel(file: string): string | null {
  const dir = file.split('/').find((segment) => segment in KIND_LABELS);
  return dir ? KIND_LABELS[dir] : null;
}

function kindBadgeMarkup(kind: string): string {
  return `<KindBadge kind="${kind}" />`;
}

function fileToImportPath(file: string): string {
  // e.g. "@warp-drive/core/build-config/debugging.md" → "@warp-drive/core/build-config/debugging"
  // e.g. "@warp-drive/core/classes/ConfiguredStore.md" → "@warp-drive/core"
  // e.g. "@warp-drive/holodeck/mock/functions/GET.md"  → "@warp-drive/holodeck/mock"
  const p = file.replace(/\.md$/, '').replace(/\/index$/, '');
  const segments = p.split('/');

  const [packageName, subPath] = segments[0].startsWith('@')
    ? [`${segments[0]}/${segments[1]}`, segments.slice(2)]
    : [segments[0], segments.slice(1)];

  // Strip the TYPE_DIR segment and everything after it (classes/Foo → removed, leaving parent module)
  const typeDirIdx = subPath.findIndex((s) => TYPE_DIRS.has(s));
  const cleanSubPath = typeDirIdx >= 0 ? subPath.slice(0, typeDirIdx) : subPath;

  if (cleanSubPath.length === 0) return packageName;
  return `${packageName}/${cleanSubPath.join('/')}`;
}

const HEADING_RE = /^(#{1,6}) (.*)$/;

function sinceBadgeMarkup(version: string): string {
  return `<SinceBadge version="${version.replace(/"/g, '&quot;')}" />`;
}

/**
 * TypeDoc renders each `@since` tag as its own `#### Since` section beneath the heading of the
 * thing it documents (the page's own H1, or a nested member heading for e.g. a class method).
 * This removes every such section from the body and turns its version into a `<SinceBadge>`
 * appended to the heading it described, so `@since` reads as a badge next to the name of the
 * documented thing rather than as a separate body section.
 */
function extractSinceBadges(content: string): { content: string; moduleSince: string | null } {
  const lines = content.split('\n');
  const headings: { index: number; level: number; text: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = HEADING_RE.exec(lines[i]);
    if (m) headings.push({ index: i, level: m[1].length, text: m[2].trim() });
  }

  const linesToRemove = new Set<number>();
  const badgesByHeadingLine = new Map<number, string[]>();
  let moduleSince: string | null = null;

  for (let hi = 0; hi < headings.length; hi++) {
    const heading = headings[hi];
    if (heading.text !== 'Since') continue;

    const blockEnd = hi + 1 < headings.length ? headings[hi + 1].index : lines.length;
    // The tag's own content is just its first paragraph — stop at the first blank line rather
    // than the next heading, so a trailing `***` member separator (or a following tag section
    // like `#### Deprecated`) isn't swallowed into the version string.
    let versionStart = heading.index + 1;
    while (versionStart < blockEnd && lines[versionStart].trim() === '') versionStart++;
    let versionEnd = versionStart;
    while (versionEnd < blockEnd && lines[versionEnd].trim() !== '') versionEnd++;
    // A version is always a single token (e.g. `5.9.0`); a handful of source comments have a
    // stray unrecognized tag (e.g. a leftover `@class Foo`) immediately after `@since` with no
    // blank line between them, which TypeDoc folds into the same tag content as a second line —
    // only the first line is ever the actual version.
    const version = (lines[versionStart] ?? '').trim();

    let removalEnd = versionEnd;
    if (removalEnd < blockEnd && lines[removalEnd].trim() === '') removalEnd++;
    for (let li = heading.index; li < removalEnd; li++) linesToRemove.add(li);

    let parent: (typeof headings)[number] | null = null;
    for (let pi = hi - 1; pi >= 0; pi--) {
      if (headings[pi].level < heading.level) {
        parent = headings[pi];
        break;
      }
    }

    if (!parent) {
      // No enclosing heading (e.g. a module's own `@since`, rendered before any heading) —
      // let the caller attach this to the module badge instead.
      moduleSince = version;
      continue;
    }

    const existing = badgesByHeadingLine.get(parent.index) ?? [];
    existing.push(sinceBadgeMarkup(version));
    badgesByHeadingLine.set(parent.index, existing);
  }

  for (const [lineIndex, badges] of badgesByHeadingLine) {
    lines[lineIndex] = `${lines[lineIndex]} ${badges.join(' ')}`;
  }

  const kept = lines
    .filter((_, i) => !linesToRemove.has(i))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');

  return { content: kept, moduleSince };
}

// Structural groupings typedoc-plugin-markdown inserts between an overloaded function/method's
// H1 and its per-overload content — not real nested members, so a `@badge` tag under one of
// these (once per overload) still counts as belonging to the page's own top-level symbol.
const PASSTHROUGH_HEADINGS = new Set(['Call Signature', 'Constructor Signature', 'Get Signature', 'Set Signature']);

/**
 * Reads an optional single-line tag (rendered as e.g. `## Badge` / `## Title`) on the page's own
 * top-level symbol, and strips its section(s) from the body. Only a tag that belongs to the
 * page's own symbol counts: walking up from it must reach the H1 without passing through
 * anything other than the structural signature groupings above — a real nested member (e.g. a
 * class's own method) blocks it, since these tags only ever affect the page's own H1.
 */
function extractTopLevelTagValue(content: string, tagText: string): { content: string; value: string | null } {
  const lines = content.split('\n');
  const headings: { index: number; level: number; text: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = HEADING_RE.exec(lines[i]);
    if (m) headings.push({ index: i, level: m[1].length, text: m[2].trim() });
  }

  const linesToRemove = new Set<number>();
  let value: string | null = null;

  for (let hi = 0; hi < headings.length; hi++) {
    const heading = headings[hi];
    if (heading.text !== tagText) continue;

    let reachedH1 = false;
    let idx = hi;
    while (true) {
      let parentIdx = -1;
      for (let pi = idx - 1; pi >= 0; pi--) {
        if (headings[pi].level < headings[idx].level) {
          parentIdx = pi;
          break;
        }
      }
      if (parentIdx === -1) break;
      if (headings[parentIdx].level === 1) {
        reachedH1 = true;
        break;
      }
      if (!PASSTHROUGH_HEADINGS.has(headings[parentIdx].text)) break;
      idx = parentIdx;
    }
    if (!reachedH1) continue;

    const blockEnd = hi + 1 < headings.length ? headings[hi + 1].index : lines.length;
    let contentStart = heading.index + 1;
    while (contentStart < blockEnd && lines[contentStart].trim() === '') contentStart++;
    const foundValue = (lines[contentStart] ?? '').trim();
    if (!foundValue) continue;

    let removalEnd = contentStart + 1;
    while (removalEnd < blockEnd && lines[removalEnd].trim() !== '') removalEnd++;
    if (removalEnd < blockEnd && lines[removalEnd].trim() === '') removalEnd++;
    for (let li = heading.index; li < removalEnd; li++) linesToRemove.add(li);

    value ??= foundValue;
  }

  const kept = lines
    .filter((_, i) => !linesToRemove.has(i))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');

  return { content: kept, value };
}

/** Escapes `<`/`>` so literal component-like syntax (e.g. `<Await />`) renders as text rather
 * than being parsed as an HTML/Vue tag — matches how TypeDoc itself escapes generics in headings
 * (e.g. `Await\<T, E\>`). */
function escapeHeadingText(text: string): string {
  return text.replace(/</g, '\\<').replace(/>/g, '\\>');
}

/**
 * Removes the page's first H1 (and the blank line before it), returning any `<SinceBadge>`/
 * `<StatusBadge>` that had been attached to it so the caller can relocate it (module pages show
 * those badges next to `<ModuleBadge>` instead of a redundant title).
 */
function stripH1(content: string): { content: string; badges: string } {
  let badges = '';
  const next = content.replace(
    /\n\n# [^\n]*?((?:\s*<(?:SinceBadge|StatusBadge)[^\n]*\/>)*)\n\n?/,
    (_match, b: string) => {
      badges = b.trim();
      return '\n\n';
    }
  );
  return { content: next, badges };
}

function statusBadgeMarkup(variant: 'recommended' | 'discouraged' | 'deprecated'): string {
  return `<StatusBadge variant="${variant}" />`;
}

/**
 * TypeDoc renders every `@deprecated` tag as its own `#### Deprecated` section beneath the
 * heading of the thing it documents, same shape as `@since`. Unlike `@since`, the deprecation
 * message is worth keeping visible in the body, so this only appends a `<StatusBadge>` to the
 * heading it describes rather than removing the section.
 */
function extractDeprecatedBadges(content: string): string {
  const lines = content.split('\n');
  const headings: { index: number; level: number; text: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = HEADING_RE.exec(lines[i]);
    if (m) headings.push({ index: i, level: m[1].length, text: m[2].trim() });
  }

  for (let hi = 0; hi < headings.length; hi++) {
    const heading = headings[hi];
    if (heading.text !== 'Deprecated') continue;

    let parent: (typeof headings)[number] | null = null;
    for (let pi = hi - 1; pi >= 0; pi--) {
      if (headings[pi].level < heading.level) {
        parent = headings[pi];
        break;
      }
    }
    // A bare `@deprecated` with no enclosing heading would only happen via the same
    // packages-mode readme workaround `typedoc-since-plugin.mjs` needs for `@since` — nothing
    // injects `@deprecated` that way today, so there's no heading to attach a badge to.
    if (!parent) continue;

    lines[parent.index] = `${lines[parent.index]} ${statusBadgeMarkup('deprecated')}`;
  }

  return lines.join('\n');
}

const FLAG_TOKEN_RE = /\*\*`([A-Za-z]+)`\*\*/g;
const FLAGS_LINE_RE = /^(?:\*\*`[A-Za-z]+`\*\*)(?: \*\*`[A-Za-z]+`\*\*)*$/;
const STATUS_FLAG_VARIANTS: Record<string, 'recommended' | 'discouraged'> = {
  Recommended: 'recommended',
  Discouraged: 'discouraged',
};

/**
 * TypeDoc renders `@recommended`/`@discouraged` (registered as modifier tags, not block tags)
 * as a bold, backticked flag (e.g. `` **`Recommended`** ``) on its own line right after the
 * heading of the thing they describe, possibly alongside other flags like `` **`Legacy`** ``.
 * This turns just the recommended/discouraged token into a `<StatusBadge>` appended to that
 * heading, leaving any other flag on the same line untouched.
 */
function extractStatusFlagBadges(content: string): string {
  const lines = content.split('\n');
  const headingLineIndexes: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (HEADING_RE.test(lines[i])) headingLineIndexes.push(i);
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!FLAGS_LINE_RE.test(line)) continue;

    const tokens = [...line.matchAll(FLAG_TOKEN_RE)].map((m) => m[1]);
    const statusTokens = tokens.filter((t) => t in STATUS_FLAG_VARIANTS);
    if (statusTokens.length === 0) continue;

    let headingLineIndex = -1;
    for (let hi = headingLineIndexes.length - 1; hi >= 0; hi--) {
      if (headingLineIndexes[hi] < i) {
        headingLineIndex = headingLineIndexes[hi];
        break;
      }
    }
    // A flags line always sits directly under the heading of the symbol it flags; if somehow
    // there isn't one above it, leave the line as TypeDoc rendered it.
    if (headingLineIndex === -1) continue;

    const badges = statusTokens.map((t) => statusBadgeMarkup(STATUS_FLAG_VARIANTS[t]));
    lines[headingLineIndex] = `${lines[headingLineIndex]} ${badges.join(' ')}`;

    const remainingTokens = tokens.filter((t) => !(t in STATUS_FLAG_VARIANTS));
    lines[i] = remainingTokens.map((t) => `**\`${t}\`**`).join(' ');
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n');
}

export async function postProcessApiDocs() {
  const dir = path.join(__dirname, '../tmp/api');
  const outDir = path.join(__dirname, '../docs.warp-drive.io/api');
  mkdirSync(outDir, { recursive: true });

  // remove the `_media` directory that typedoc generates
  rmSync(path.join(dir, '_media'), { recursive: true, force: true });

  // cleanup and prepare the sidebar items
  const sidebarPath = path.join(outDir, 'typedoc-sidebar.json');
  const navStructure = JSON.parse(readFileSync(path.join(dir, 'typedoc-sidebar.json'), 'utf-8')) as SidebarItem[];
  const sidebar = splitApiDocsSidebar(cleanSidebarItems(navStructure));
  writeFileSync(sidebarPath, JSON.stringify(sidebar, null, 2), 'utf-8');

  // get the package list
  const MainPackages: string[] = [];
  const FrameworkPackages: string[] = [];
  const ToolingPackages: string[] = [];
  const OldPackages: string[] = [];
  for (const item of sidebar.corePackages.items) {
    MainPackages.push(`- [${item.text}](${item.link!})`);
  }
  for (const item of sidebar.frameworkPackages.items) {
    FrameworkPackages.push(`- [${item.text}](${item.link!})`);
  }
  for (const item of sidebar.toolingPackages.items) {
    ToolingPackages.push(`- [${item.text}](${item.link!})`);
  }
  for (const item of sidebar.oldPackages) {
    OldPackages.push(`- [${item.text}](${item.link!})`);
  }

  // generate the API documentation
  const apiDocumentation = `${ApiDocumentation}\n\n## Main Packages\n\n${MainPackages.join('\n')}\n\n## Framework Packages\n\n${FrameworkPackages.join('\n')}\n\n## Tooling Packages\n\n${ToolingPackages.join('\n')}\n\n## Legacy Packages\n\n${OldPackages.join('\n')}\n\n`;

  // copy the rest of the files
  const files = globSync('**/*.md', { cwd: dir, nodir: true });
  for (const file of files) {
    if (file === 'index.md') {
      // Generate a custom index.md file
      writeFileSync(path.join(outDir, 'index.md'), apiDocumentation, 'utf-8');
      continue;
    }
    const content = readFileSync(path.join(dir, file), 'utf-8');
    const outFile = path.join(outDir, file);
    mkdirSync(path.dirname(outFile), { recursive: true });

    let newContent = content;

    // Replace the entire breadcrumb line with the badge (no subpath links)
    const importPath = fileToImportPath(file);
    newContent = newContent.replace(/^[^\n]+\n\n/, `<ModuleBadge path="${importPath}" />\n\n`);

    // On a member's own page, show its kind (Function, Class, ...) as a <KindBadge> before its
    // name instead of TypeDoc's "{Kind}: " title prefix (dropped via pageTitleTemplates in
    // typedoc.config.mjs). A `@badge <Label>` tag overrides the label shown (e.g. a class that's
    // conceptually a "Component", a variable that's a "Handler"). A `@title <Text>` tag overrides
    // the name itself (e.g. showing a component's name as `<Await />`).
    const defaultKind = fileKindLabel(file);
    if (defaultKind) {
      const kindOverride = extractTopLevelTagValue(newContent, 'Badge');
      newContent = kindOverride.content;
      const titleOverride = extractTopLevelTagValue(newContent, 'Title');
      newContent = titleOverride.content;
      const kind = kindOverride.value ?? defaultKind;
      newContent = newContent.replace(/^# ([^\n]+)$/m, (_match, title: string) => {
        const displayTitle = titleOverride.value ? escapeHeadingText(titleOverride.value) : title;
        return `# ${kindBadgeMarkup(kind)} ${displayTitle}`;
      });
    }

    // Turn every `#### Since` section into a `<SinceBadge>` next to the heading it describes
    const sinceResult = extractSinceBadges(newContent);
    newContent = sinceResult.content;

    // Turn every `#### Deprecated` section into a `<StatusBadge>` next to the heading it
    // describes, and turn the `@recommended`/`@discouraged` flags TypeDoc renders for those
    // modifier tags into matching `<StatusBadge>`s.
    newContent = extractDeprecatedBadges(newContent);
    newContent = extractStatusFlagBadges(newContent);

    if (path.basename(file) === 'index.md') {
      // Module page: the module name is already shown via <ModuleBadge>, so drop the redundant
      // H1 title, relocating any `@since` badge it carried onto the <ModuleBadge> line.
      const { content: withoutH1, badges } = stripH1(newContent);
      newContent = withoutH1;
      const since = badges || (sinceResult.moduleSince ? sinceBadgeMarkup(sinceResult.moduleSince) : '');
      if (since) {
        newContent = newContent.replace(/^(<ModuleBadge [^\n]+\/>)/, `$1 ${since}`);
      }
    }
    // Non-module pages keep their H1 so the page shows the name of the thing being documented,
    // with any `<SinceBadge>` appended right next to it.

    // if the file is in @warp-drive/legacy add the legacy badge
    if (file.includes('@warp-drive/legacy')) {
      newContent = newContent.replace(/^(<ModuleBadge [^\n]+\/>)/, `$1 <Badge type="danger" text="@legacy" />`);
    }

    // if the file is in @warp-drive/experiments add the experimental badge
    if (file.includes('@warp-drive/experiments')) {
      newContent = newContent.replace(/^(<ModuleBadge [^\n]+\/>)/, `$1 <Badge type="warning" text="@experimental" />`);
    }

    // insert frontmatter
    newContent = buildFrontmatter(newContent) + newContent;

    // if the content has a modules list, we remove it
    if (newContent.includes('## Modules')) {
      newContent = newContent.slice(0, newContent.indexOf('## Modules'));
    }

    // if the content has `Interface` or `Type Aliases` we collapse them
    const hasInterfaces = newContent.includes('## Interfaces');
    const hasTypeAliases = newContent.includes('## Type Aliases');
    if (hasInterfaces) {
      newContent = newContent.replace('## Interfaces', '## Types');
      newContent = newContent.replace('\n\n## Type Aliases\n', '');
    } else if (hasTypeAliases) {
      newContent = newContent.replace('## Type Aliases', '## Types');
    }

    // if the content has `Properties` and `Accessors` we collapse them
    const hasProperties = newContent.includes('## Properties');
    const hasAccessors = newContent.includes('## Accessors');
    if (hasAccessors) {
      if (hasProperties) {
        newContent = newContent.replace('\n\n## Accessors\n', '');
      } else {
        newContent = newContent.replace('## Accessors', '## Properties');
      }
    }

    writeFileSync(outFile, newContent, 'utf-8');
  }

  await import(sidebarPath, {
    with: { type: 'json' },
  });

  return sidebar;
}
