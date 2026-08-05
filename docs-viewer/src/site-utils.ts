import path from 'path';
import { globSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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

interface DirMeta {
  title?: string;
  collapsed?: boolean;
  draft?: boolean;
  /** Ordered list of child slugs (filenames without .md, or directory names). Unlisted items sort alphabetically after listed ones. */
  items?: string[];
}

interface WarpDriveFrontMatter {
  title?: string;
  draft?: boolean;
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

export async function getGuidesStructure() {
  const GuidesDirectoryPath = path.join(__dirname, '../docs.warp-drive.io/guides');

  // Load all _meta.json files up front; keys are forward-slash dir paths relative to GuidesDirectoryPath
  const metaFiles = globSync('**/_meta.json', { cwd: GuidesDirectoryPath });
  const dirMeta = new Map<string, DirMeta>();
  for (const metaFile of metaFiles) {
    const dirPath = path.dirname(metaFile);
    const key = dirPath === '.' ? '' : normPath(dirPath);
    dirMeta.set(key, JSON.parse(readFileSync(path.join(GuidesDirectoryPath, metaFile), 'utf-8')) as DirMeta);
  }

  const glob = globSync('**/*.md', { cwd: GuidesDirectoryPath });
  const groups: Record<string, GuideGroup> = {};

  for (const filepath of glob) {
    const slugPath: string[] = [];
    const text = readFileSync(path.join(GuidesDirectoryPath, filepath), 'utf-8');
    const frontMatter = fm<WarpDriveFrontMatter>(text);

    if (frontMatter.attributes.draft) {
      continue;
    }

    // Skip files whose immediate parent directory is marked draft in _meta.json
    const fileDir = normPath(path.dirname(filepath));
    if (fileDir !== '.' && dirMeta.get(fileDir)?.draft) {
      continue;
    }

    if (filepath === 'index.md') {
      const rootMeta = dirMeta.get('') ?? {};
      const theManualMeta = dirMeta.get('the-manual') ?? {};
      groups['the-manual'] = groups['the-manual'] ?? {
        text: rootMeta.title ?? 'The Manual',
        path: 'the-manual',
        slug: 'the-manual',
        orderedItems: theManualMeta.items,
        collapsed: rootMeta.collapsed ?? true,
        link: '/guides/index.md',
        items: {},
      };
      Object.assign(groups['the-manual'], {
        text: rootMeta.title ?? 'The Manual',
        path: 'the-manual',
        slug: 'the-manual',
        orderedItems: theManualMeta.items,
        collapsed: rootMeta.collapsed ?? true,
        link: '/guides/index.md',
      });
      groups['the-manual'].items['index.md'] = {
        text: frontMatter.attributes.title ?? 'Introduction',
        path: 'index.md',
        slug: 'index.md',
        collapsed: false,
        items: {},
        link: '/guides/index.md',
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
    const realUrl = `/guides/${filepath}`;

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
        text: frontMatter.attributes.title ?? 'Overview',
        link: group[lastSegment]!.link!,
        items: {},
      };
    } else {
      if (frontMatter.attributes.title) {
        leaf.text = frontMatter.attributes.title;
      }
    }
  }

  const rootMeta = dirMeta.get('') ?? {};
  const result = deepConvert(groups, rootMeta.items);
  const structure = { paths: result };

  writeFileSync(
    path.join(__dirname, '../docs.warp-drive.io/guides/nav.json'),
    JSON.stringify(structure, null, 2),
    'utf-8'
  );
  await import(path.join(__dirname, '../docs.warp-drive.io/guides/nav.json'), {
    with: { type: 'json' },
  });

  return { paths: result };
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

const OLD_PACKAGES = [
  '@ember-data/adapter',
  '@ember-data/active-record',
  '@ember-data/debug',
  '@ember-data/legacy-compat',
  '@ember-data/model',
  '@ember-data/json-api',
  '@ember-data/store',
  '@ember-data/graph',
  '@ember-data/request',
  '@ember-data/request-utils',
  '@ember-data/rest',
  '@ember-data/serializer',
  '@ember-data/tracking',
  '@warp-drive/core-types',
  '@warp-drive/build-config',
  '@warp-drive/schema-record',
];

const CORE_PACKAGES = [
  '@warp-drive/core',
  '@warp-drive/experiments',
  '@warp-drive/json-api',
  '@warp-drive/utilities',
  '@warp-drive/legacy',
  '@warp-drive/holodeck',
  'eslint-plugin-warp-drive',
];

function isFrameworkPackage(name: string) {
  return !OLD_PACKAGES.includes(name) && !CORE_PACKAGES.includes(name);
}

export function splitApiDocsSidebar(sidebar: SidebarItem[]) {
  const oldPackages: SidebarItem[] = [];
  const corePackages = { text: 'Universal', items: [] as SidebarItem[] } satisfies SidebarItem;
  const frameworkPackages = { text: 'Frameworks', items: [] as SidebarItem[] } satisfies SidebarItem;

  for (const item of sidebar) {
    if (OLD_PACKAGES.includes(item.text)) {
      oldPackages.push(item);
    } else {
      if (isFrameworkPackage(item.text)) {
        frameworkPackages.items.push(item);
      } else {
        corePackages.items.push(item);
      }
    }
  }

  return {
    oldPackages,
    frameworkPackages,
    corePackages,
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

  if (submodules.length === 0) {
    return newItems;
  }

  if (hoisted.items!.length > 0) {
    // if we have hoisted items, we add them to the new items
    newItems.unshift(hoisted);
  }

  return newItems.concat(submodules);
}

const DOC_FRONTMATTER = `---
outline:
  level: [2, 3]
---
`;
const ApiDocumentation = `# API Docs\n\n`;

const TYPE_DIRS = new Set(['classes', 'functions', 'interfaces', 'type-aliases', 'variables', 'enumerations']);

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
  const OldPackages: string[] = [];
  for (const item of sidebar.corePackages.items) {
    MainPackages.push(`- [${item.text}](${item.link!})`);
  }
  for (const item of sidebar.frameworkPackages.items) {
    FrameworkPackages.push(`- [${item.text}](${item.link!})`);
  }
  for (const item of sidebar.oldPackages) {
    OldPackages.push(`- [${item.text}](${item.link!})`);
  }

  // generate the API documentation
  const apiDocumentation = `${ApiDocumentation}\n\n## Main Packages\n\n${MainPackages.join('\n')}\n\n## Framework Packages\n\n${FrameworkPackages.join('\n')}\n\n## Legacy Packages\n\n${OldPackages.join('\n')}\n\n`;

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

    // Remove the first H1 heading and the blank line before it
    newContent = newContent.replace(/\n\n# [^\n]+\n\n?/, '\n\n');

    // if the file is in @warp-drive/legacy add the legacy badge
    if (file.includes('@warp-drive/legacy')) {
      newContent = newContent.replace(/^(<ModuleBadge [^\n]+\/>)/, `$1 <Badge type="danger" text="@legacy" />`);
    }

    // insert frontmatter
    newContent = DOC_FRONTMATTER + newContent;

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
