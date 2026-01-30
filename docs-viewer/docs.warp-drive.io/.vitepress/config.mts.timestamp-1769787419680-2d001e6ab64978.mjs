// docs.warp-drive.io/.vitepress/config.mts
import { withPwa } from "file:///Users/mehul/oss/ember/data/node_modules/.pnpm/@vite-p_e670997555d28629f4cdbdd0ad6b1c68/node_modules/@vite-pwa/vitepress/dist/index.mjs";
import { defineConfig } from "file:///Users/mehul/oss/ember/data/node_modules/.pnpm/vitepress@1.6.4_typescript@5.9.2/node_modules/vitepress/dist/node/index.js";

// src/site-utils.ts
import path from "path";
import { globSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import fm from "file:///Users/mehul/oss/ember/data/node_modules/.pnpm/front-matter@4.0.2/node_modules/front-matter/index.js";
var __vite_injected_original_dirname = "/Users/mehul/oss/ember/data/docs-viewer/src";
var DefaultOpenGroups = [];
var AlwaysOpenGroups = [];
function segmentToTitle(segment, prevSegment) {
  if (segment === "index.md") {
    if (!prevSegment) return "Introduction";
    segment = prevSegment;
  }
  const value = segment.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1));
  if (!isNaN(Number(value[0]))) {
    value.shift();
  }
  const result = value.join(" ").replace(".md", "");
  return result === "Index" ? "Introduction" : result;
}
async function getGuidesStructure() {
  const GuidesDirectoryPath = path.join(__vite_injected_original_dirname, "../docs.warp-drive.io/guides");
  const glob = globSync("**/*.md", { cwd: GuidesDirectoryPath });
  const groups = {};
  for (const filepath of glob) {
    const slugPath = [];
    const text = readFileSync(path.join(GuidesDirectoryPath, filepath), "utf-8");
    const frontMatter = fm(text);
    if (frontMatter.attributes.draft) {
      continue;
    }
    if (filepath === "index.md") {
      groups["the-manual"] = groups["the-manual"] || {
        text: frontMatter.attributes.categoryTitle,
        path: filepath,
        slug: filepath,
        index: frontMatter.attributes.categoryOrder || 0,
        collapsed: frontMatter.attributes.collapsed || true,
        link: "/guides/index.md",
        items: {}
      };
      Object.assign(groups["the-manual"], {
        text: frontMatter.attributes.categoryTitle,
        index: frontMatter.attributes.categoryOrder || 0,
        collapsed: frontMatter.attributes.collapsed || true,
        link: "/guides/index.md"
      });
      groups["the-manual"].items[filepath] = {
        text: frontMatter.attributes.title,
        path: filepath,
        slug: filepath,
        index: frontMatter.attributes.order ?? 0,
        collapsed: false,
        items: {},
        link: "/guides/index.md"
      };
      continue;
    }
    const segments = filepath.split(path.sep);
    let lastSegment = segments.pop();
    let isIndex = false;
    if (lastSegment === "index.md") {
      lastSegment = segments.pop();
      if (!lastSegment) {
        throw new Error(`Top Level Index.md is not allowed: ${filepath}`);
      }
      isIndex = true;
    }
    let group = groups;
    let parent = null;
    for (let i = 0; i < segments.length; i++) {
      const prevSegment = i > 0 ? segments[i - 1] : null;
      const segment = segments[i];
      slugPath.push(segment);
      const key2 = slugPath.join(".");
      const collapsed = AlwaysOpenGroups.includes(key2) ? null : DefaultOpenGroups.includes(key2) ? false : true;
      if (!group[segment]) {
        group[segment] = {
          text: segmentToTitle(segment, prevSegment),
          index: null,
          path: segment,
          slug: segment,
          collapsed,
          items: {}
        };
      }
      parent = group[segment];
      group = group[segment].items;
    }
    slugPath.push(lastSegment);
    const key = slugPath.join(".");
    const realUrl = `/guides/${filepath}`;
    if (!group[lastSegment]) {
      group[lastSegment] = {
        text: segmentToTitle(lastSegment, parent ? parent.path : null),
        index: null,
        path: lastSegment,
        slug: lastSegment,
        collapsed: AlwaysOpenGroups.includes(key) ? null : DefaultOpenGroups.includes(key) ? false : true,
        items: {},
        // if we are an index file, this has the effect of setting the link on the parent node
        // this seems to work even though there's an issue
        // that says it doesn't: https://github.com/vuejs/vitepress/issues/2989
        // however:
        // when doing this, the "next page" feature breaks for
        // these pages, so for now we just do non-clickable headers.
        link: realUrl
      };
    } else {
      group[lastSegment].link = realUrl;
    }
    const leaf = group[lastSegment];
    if (isIndex) {
      if ("collapsed" in frontMatter.attributes) {
        leaf.collapsed = frontMatter.attributes.collapsed;
      }
      if ("categoryOrder" in frontMatter.attributes) {
        leaf.index = frontMatter.attributes.categoryOrder;
      }
      if ("categoryTitle" in frontMatter.attributes) {
        leaf.text = frontMatter.attributes.categoryTitle;
      }
      leaf.items["index.md"] = {
        path: "index.md",
        slug: "index.md",
        collapsed: false,
        text: frontMatter.attributes.title ?? "Overview",
        index: frontMatter.attributes.order ?? 0,
        link: group[lastSegment].link,
        items: {}
      };
    } else {
      if (frontMatter.attributes.title) {
        leaf.text = frontMatter.attributes.title;
      }
      if ("order" in frontMatter.attributes) {
        leaf.index = frontMatter.attributes.order;
      }
    }
  }
  const result = deepConvert(groups);
  const structure = { paths: result };
  writeFileSync(
    path.join(__vite_injected_original_dirname, "../docs.warp-drive.io/guides/nav.json"),
    JSON.stringify(structure, null, 2),
    "utf-8"
  );
  await import(path.join(__vite_injected_original_dirname, "../docs.warp-drive.io/guides/nav.json"), {
    with: { type: "json" }
  });
  return { paths: result };
}
function deepConvert(obj) {
  const groups = Array.from(Object.values(obj));
  const sortedGroups = new Array(groups.length).fill(null);
  for (const group of groups) {
    if (group.index !== null) {
      if (group.index < 0 || group.index >= groups.length) {
        throw new Error(`Invalid index ${group.index} for ${group.path}, must be between 0 and ${groups.length - 1}`);
      }
      if (sortedGroups[group.index] !== null) {
        throw new Error(`Duplicate index ${group.index} for ${group.path}, matches ${sortedGroups[group.index]}`);
      }
      sortedGroups[group.index] = group;
    }
    delete group.path;
    delete group.slug;
    if (group.items) {
      if (Object.keys(group.items).length === 0) {
        delete group.items;
        delete group.collapsed;
      } else {
        group.items = deepConvert(group.items);
        if (!group.link && !group.items[0].items) {
          group.link = group.items[0].link;
        }
      }
    }
  }
  for (const group of groups) {
    if (group.index === null) {
      const firstNullIndex = sortedGroups.findIndex((g) => g === null);
      if (firstNullIndex !== -1) {
        sortedGroups[firstNullIndex] = group;
        group.index = firstNullIndex;
      }
    }
  }
  return sortedGroups;
}
var OLD_PACKAGES = [
  "@ember-data/adapter",
  "@ember-data/active-record",
  "@ember-data/debug",
  "@ember-data/legacy-compat",
  "@ember-data/model",
  "@ember-data/json-api",
  "@ember-data/store",
  "@ember-data/graph",
  "@ember-data/request",
  "@ember-data/request-utils",
  "@ember-data/rest",
  "@ember-data/serializer",
  "@ember-data/tracking",
  "@warp-drive/core-types",
  "@warp-drive/build-config",
  "@warp-drive/schema-record"
];
var CORE_PACKAGES = [
  "@warp-drive/core",
  "@warp-drive/experiments",
  "@warp-drive/json-api",
  "@warp-drive/utilities",
  "@warp-drive/legacy",
  "@warp-drive/holodeck",
  "eslint-plugin-warp-drive"
];
function isFrameworkPackage(name) {
  return !OLD_PACKAGES.includes(name) && !CORE_PACKAGES.includes(name);
}
function splitApiDocsSidebar(sidebar) {
  const oldPackages = [];
  const corePackages = { text: "Universal", items: [] };
  const frameworkPackages = { text: "Frameworks", items: [] };
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
    corePackages
  };
}
var HOISTED_PRIMITIVES = ["Classes", "Variables", "Functions"];
var FILTERED_NAV_ITEMS = ["Interfaces", "Type Aliases"];
var META_PACKAGES = ["ember-data", "warp-drive", "eslint-plugin-ember-data", "eslint-plugin-warp-drive"];
function cleanSidebarItems(items, isPrimitive = false) {
  const newItems = [];
  let submodules = [];
  const hoisted = { text: "exports", items: [] };
  for (const item of items) {
    if (FILTERED_NAV_ITEMS.includes(item.text)) {
      continue;
    }
    if (HOISTED_PRIMITIVES.includes(item.text)) {
      hoisted.items.push(...cleanSidebarItems(item.items || [], true));
      continue;
    }
    if (item.text === "Modules") {
      submodules = cleanSidebarItems(item.items || []);
      continue;
    }
    if (!META_PACKAGES.includes(item.text) && !item.text.startsWith("@") && !isPrimitive) {
      item.text = "/" + item.text;
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
  if (hoisted.items.length > 0) {
    newItems.unshift(hoisted);
  }
  return newItems.concat(submodules);
}
var DOC_FRONTMATTER = `---
outline:
  level: [2, 3]
---
`;
var ApiDocumentation = `# API Docs

`;
async function postProcessApiDocs() {
  const dir = path.join(__vite_injected_original_dirname, "../tmp/api");
  const outDir = path.join(__vite_injected_original_dirname, "../docs.warp-drive.io/api");
  mkdirSync(outDir, { recursive: true });
  rmSync(path.join(dir, "_media"), { recursive: true, force: true });
  const sidebarPath = path.join(outDir, "typedoc-sidebar.json");
  const navStructure = JSON.parse(readFileSync(path.join(dir, "typedoc-sidebar.json"), "utf-8"));
  const sidebar = splitApiDocsSidebar(cleanSidebarItems(navStructure));
  writeFileSync(sidebarPath, JSON.stringify(sidebar, null, 2), "utf-8");
  const MainPackages = [];
  const FrameworkPackages = [];
  const OldPackages = [];
  for (const item of sidebar.corePackages.items) {
    MainPackages.push(`- [${item.text}](${item.link})`);
  }
  for (const item of sidebar.frameworkPackages.items) {
    FrameworkPackages.push(`- [${item.text}](${item.link})`);
  }
  for (const item of sidebar.oldPackages) {
    OldPackages.push(`- [${item.text}](${item.link})`);
  }
  const apiDocumentation = `${ApiDocumentation}

## Main Packages

${MainPackages.join("\n")}

## Framework Packages

${FrameworkPackages.join("\n")}

## Legacy Packages

${OldPackages.join("\n")}

`;
  const files = globSync("**/*.md", { cwd: dir, nodir: true });
  for (const file of files) {
    if (file === "index.md") {
      writeFileSync(path.join(outDir, "index.md"), apiDocumentation, "utf-8");
      continue;
    }
    const content = readFileSync(path.join(dir, file), "utf-8");
    const outFile = path.join(outDir, file);
    mkdirSync(path.dirname(outFile), { recursive: true });
    let newContent = content;
    if (file.includes("@warp-drive/legacy")) {
      newContent = `<Badge type="danger" text="@legacy" /><br><br>` + content;
    }
    newContent = DOC_FRONTMATTER + newContent;
    if (newContent.includes("## Modules")) {
      newContent = newContent.slice(0, newContent.indexOf("## Modules"));
    }
    const hasInterfaces = newContent.includes("## Interfaces");
    const hasTypeAliases = newContent.includes("## Type Aliases");
    if (hasInterfaces) {
      newContent = newContent.replace("## Interfaces", "## Types");
      newContent = newContent.replace("\n\n## Type Aliases\n", "");
    } else if (hasTypeAliases) {
      newContent = newContent.replace("## Type Aliases", "## Types");
    }
    const hasProperties = newContent.includes("## Properties");
    const hasAccessors = newContent.includes("## Accessors");
    if (hasAccessors) {
      if (hasProperties) {
        newContent = newContent.replace("\n\n## Accessors\n", "");
      } else {
        newContent = newContent.replace("## Accessors", "## Properties");
      }
    }
    writeFileSync(outFile, newContent, "utf-8");
  }
  await import(sidebarPath, {
    with: { type: "json" }
  });
  return sidebar;
}

// docs.warp-drive.io/.vitepress/config.mts
import { tabsMarkdownPlugin } from "file:///Users/mehul/oss/ember/data/node_modules/.pnpm/vitepre_9f54da5a7e5ae672e25ba3d6051a12c2/node_modules/vitepress-plugin-tabs/dist/index.js";
import { footnote } from "file:///Users/mehul/oss/ember/data/node_modules/.pnpm/@mdit+plugin-footnote@0.22.2/node_modules/@mdit/plugin-footnote/lib/index.js";
import llmstxt from "file:///Users/mehul/oss/ember/data/node_modules/.pnpm/vitepress-plugin-llms@1.7.3/node_modules/vitepress-plugin-llms/dist/index.js";
import { ViteImageOptimizer } from "file:///Users/mehul/oss/ember/data/node_modules/.pnpm/vite-pl_d5ad62290415b28187dc0f743e9c1ce4/node_modules/vite-plugin-image-optimizer/dist/index.js";
import { groupIconMdPlugin, groupIconVitePlugin } from "file:///Users/mehul/oss/ember/data/node_modules/.pnpm/vitepre_a42283dfa7c49c12b9a65a49e843dfaf/node_modules/vitepress-plugin-group-icons/dist/index.js";
var TypeDocSidebar = await postProcessApiDocs();
var GuidesStructure = await getGuidesStructure();
var plugin = groupIconVitePlugin({
  customIcon: {
    ember: "vscode-icons:file-type-ember",
    emberjs: "vscode-icons:file-type-ember",
    "ember.js": "vscode-icons:file-type-ember",
    "Ember.js": "vscode-icons:file-type-ember",
    glimmer: "vscode-icons:file-type-glimmer",
    glimmerjs: "vscode-icons:file-type-glimmer",
    "glimmer.js": "vscode-icons:file-type-glimmer",
    "glimmer-ts": "vscode-icons:file-type-glimmer",
    "glimmer-js": "vscode-icons:file-type-glimmer",
    ".gts": "vscode-icons:file-type-glimmer",
    ".gjs": "vscode-icons:file-type-glimmer",
    ".hbs": "vscode-icons:file-type-ember"
  }
});
var config_default = withPwa(
  defineConfig({
    title: "WarpDrive",
    description: "Boldly go where no App has gone before",
    markdown: {
      config(md) {
        md.use(groupIconMdPlugin);
        md.use(tabsMarkdownPlugin);
        md.use(footnote);
      }
    },
    // @ts-expect-error
    pwa: {
      workbox: {
        // default is 2MB but the search index is much larger
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024
      }
    },
    vite: {
      plugins: [
        llmstxt(),
        plugin,
        ViteImageOptimizer({
          // // Configure optimization options for different image formats
          // png: {
          //   quality: 80,
          // },
          // jpeg: {
          //   quality: 75,
          // },
          // webp: {
          //   quality: 80,
          // },
          // avif: {
          //   quality: 70,
          // },
          // svg: {
          //   plugins: [{ name: 'removeViewBox', active: false }, { name: 'sortAttrs' }],
          // },
        })
      ]
    },
    // just until we have the guides and docs in a better state
    ignoreDeadLinks: false,
    // this won't work properly until we don't need to sync the guides
    // from the repo root into the docs-viewer
    // lastUpdated: true,
    head: [
      ["link", { rel: "manifest", href: "/site.webmanifest" }],
      ["link", { rel: "icon", href: "/favicon.ico", sizes: "32x32" }],
      ["link", { rel: "icon", href: "/logos/warp-drive/prefers-color-w.svg", type: "image/svg+xml" }],
      ["link", { rel: "apple-touch-icon", href: "/logos/favicon/logo-yellow-square-180x180.png", type: "image/png" }],
      [
        "meta",
        {
          name: "keywords",
          content: "data-framework fetch typescript typed REST data-loading apps GraphQL JSON:API jsonapi json reactivity signals cross-framework MPA SPA"
        }
      ],
      [
        "meta",
        {
          name: "description",
          content: "WarpDrive is a lightweight data library for web apps \u2014 universal, typed, reactive, and ready to scale."
        }
      ],
      [
        "meta",
        {
          name: "apple-mobile-web-app-title",
          content: "WarpDrive"
        }
      ],
      [
        "meta",
        {
          itemprop: "description",
          content: "WarpDrive is a lightweight data library for web apps \u2014 universal, typed, reactive, and ready to scale."
        }
      ],
      ["meta", { property: "og:title", content: "WarpDrive" }],
      ["meta", { property: "og:site_name", content: "warp-drive.io" }],
      ["meta", { property: "og:type", content: "website" }],
      [
        "meta",
        {
          property: "og:description",
          content: "WarpDrive is a lightweight data library for web apps \u2014 universal, typed, reactive, and ready to scale."
        }
      ],
      ["meta", { property: "og:url", content: "https://warp-drive.io" }],
      ["meta", { property: "og:image", content: "/logos/warp-drive/github-header.png" }]
      // ['meta', { property: 'og:image', content: '/logos/social1.png' }],
      // ['meta', { property: 'og:image', content: '/logos/social2.png' }],
      // [
      //   'link',
      //   { rel: 'preconnect', href: 'https://fonts.googleapis.com' }
      // ],
      // [
      //   'link',
      //   { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }
      // ],
      // [
      //   'link',
      //   { href: 'https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&amp;display=swap', rel: 'stylesheet' }
      // ]
    ],
    // github pages supports cleanURLs
    cleanUrls: true,
    base: process.env.BASE || "/",
    // we want to use rewrites but can't https://github.com/vuejs/vitepress/issues/4364
    // rewrites: GuidesStructure.rewritten,
    sitemap: {
      hostname: process.env.HOSTNAME || "https://canary.warp-drive.io"
    },
    themeConfig: {
      siteTitle: false,
      logo: {
        dark: "/logos/warp-drive/word-mark-white.svg",
        light: "/logos/warp-drive/warp-drive-logo-dark.svg",
        alt: "WarpDrive"
      },
      // https://vitepress.dev/reference/default-theme-config
      nav: [
        { text: "Guides", link: "/guides" },
        { text: "API Docs", link: "/api" },
        { text: "Contributing", link: "/guides/contributing/become-a-contributor" }
      ],
      sidebar: [
        ...GuidesStructure.paths,
        {
          text: "API Docs",
          collapsed: true,
          // link: '/api/',
          items: [
            { text: "Universal" },
            ...TypeDocSidebar.corePackages.items,
            { text: "Frameworks" },
            ...TypeDocSidebar.frameworkPackages.items
          ]
        },
        {
          text: "Legacy Packages",
          collapsed: true,
          // link: '/api/',
          items: TypeDocSidebar.oldPackages
        }
      ],
      socialLinks: [
        { icon: "github", link: "https://github.com/warp-drive-data/warp-drive" },
        { icon: "discord", link: "https://discord.gg/PHBbnWJx5S" },
        { icon: "bluesky", link: "https://bsky.app/profile/warp-drive.io" }
      ],
      editLink: {
        pattern: "https://github.com/warp-drive-data/warp-drive/edit/main/:path"
      },
      search: {
        provider: "local"
      },
      outline: {
        level: 2
      },
      footer: {
        message: "Released under the MIT License.",
        copyright: `Copyright &copy; 2025 Ember.js and Contributors`
      }
    }
  })
);
export {
  config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiZG9jcy53YXJwLWRyaXZlLmlvLy52aXRlcHJlc3MvY29uZmlnLm10cyIsICJzcmMvc2l0ZS11dGlscy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9tZWh1bC9vc3MvZW1iZXIvZGF0YS9kb2NzLXZpZXdlci9kb2NzLndhcnAtZHJpdmUuaW8vLnZpdGVwcmVzc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL21laHVsL29zcy9lbWJlci9kYXRhL2RvY3Mtdmlld2VyL2RvY3Mud2FycC1kcml2ZS5pby8udml0ZXByZXNzL2NvbmZpZy5tdHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL21laHVsL29zcy9lbWJlci9kYXRhL2RvY3Mtdmlld2VyL2RvY3Mud2FycC1kcml2ZS5pby8udml0ZXByZXNzL2NvbmZpZy5tdHNcIjtpbXBvcnQgeyB3aXRoUHdhIH0gZnJvbSAnQHZpdGUtcHdhL3ZpdGVwcmVzcyc7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcsIHR5cGUgUGx1Z2luIH0gZnJvbSAndml0ZXByZXNzJztcbmltcG9ydCB7IGdldEd1aWRlc1N0cnVjdHVyZSwgcG9zdFByb2Nlc3NBcGlEb2NzIH0gZnJvbSAnLi4vLi4vc3JjL3NpdGUtdXRpbHMudHMnO1xuaW1wb3J0IHsgdGFic01hcmtkb3duUGx1Z2luIH0gZnJvbSAndml0ZXByZXNzLXBsdWdpbi10YWJzJztcbmltcG9ydCB7IGZvb3Rub3RlIH0gZnJvbSAnQG1kaXQvcGx1Z2luLWZvb3Rub3RlJztcblxuY29uc3QgVHlwZURvY1NpZGViYXIgPSBhd2FpdCBwb3N0UHJvY2Vzc0FwaURvY3MoKTtcblxuaW1wb3J0IGxsbXN0eHQgZnJvbSAndml0ZXByZXNzLXBsdWdpbi1sbG1zJztcbmltcG9ydCB7IFZpdGVJbWFnZU9wdGltaXplciB9IGZyb20gJ3ZpdGUtcGx1Z2luLWltYWdlLW9wdGltaXplcic7XG5pbXBvcnQgeyBncm91cEljb25NZFBsdWdpbiwgZ3JvdXBJY29uVml0ZVBsdWdpbiB9IGZyb20gJ3ZpdGVwcmVzcy1wbHVnaW4tZ3JvdXAtaWNvbnMnO1xuXG5jb25zdCBHdWlkZXNTdHJ1Y3R1cmUgPSBhd2FpdCBnZXRHdWlkZXNTdHJ1Y3R1cmUoKTtcbmNvbnN0IHBsdWdpbiA9IGdyb3VwSWNvblZpdGVQbHVnaW4oe1xuICBjdXN0b21JY29uOiB7XG4gICAgZW1iZXI6ICd2c2NvZGUtaWNvbnM6ZmlsZS10eXBlLWVtYmVyJyxcbiAgICBlbWJlcmpzOiAndnNjb2RlLWljb25zOmZpbGUtdHlwZS1lbWJlcicsXG4gICAgJ2VtYmVyLmpzJzogJ3ZzY29kZS1pY29uczpmaWxlLXR5cGUtZW1iZXInLFxuICAgICdFbWJlci5qcyc6ICd2c2NvZGUtaWNvbnM6ZmlsZS10eXBlLWVtYmVyJyxcbiAgICBnbGltbWVyOiAndnNjb2RlLWljb25zOmZpbGUtdHlwZS1nbGltbWVyJyxcbiAgICBnbGltbWVyanM6ICd2c2NvZGUtaWNvbnM6ZmlsZS10eXBlLWdsaW1tZXInLFxuICAgICdnbGltbWVyLmpzJzogJ3ZzY29kZS1pY29uczpmaWxlLXR5cGUtZ2xpbW1lcicsXG4gICAgJ2dsaW1tZXItdHMnOiAndnNjb2RlLWljb25zOmZpbGUtdHlwZS1nbGltbWVyJyxcbiAgICAnZ2xpbW1lci1qcyc6ICd2c2NvZGUtaWNvbnM6ZmlsZS10eXBlLWdsaW1tZXInLFxuICAgICcuZ3RzJzogJ3ZzY29kZS1pY29uczpmaWxlLXR5cGUtZ2xpbW1lcicsXG4gICAgJy5nanMnOiAndnNjb2RlLWljb25zOmZpbGUtdHlwZS1nbGltbWVyJyxcbiAgICAnLmhicyc6ICd2c2NvZGUtaWNvbnM6ZmlsZS10eXBlLWVtYmVyJyxcbiAgfSxcbn0pIGFzIHVua25vd24gYXMgUGx1Z2luW107XG4vLyBodHRwczovL3ZpdGVwcmVzcy5kZXYvcmVmZXJlbmNlL3NpdGUtY29uZmlnXG5leHBvcnQgZGVmYXVsdCB3aXRoUHdhKFxuICBkZWZpbmVDb25maWcoe1xuICAgIHRpdGxlOiAnV2FycERyaXZlJyxcbiAgICBkZXNjcmlwdGlvbjogJ0JvbGRseSBnbyB3aGVyZSBubyBBcHAgaGFzIGdvbmUgYmVmb3JlJyxcblxuICAgIG1hcmtkb3duOiB7XG4gICAgICBjb25maWcobWQpIHtcbiAgICAgICAgbWQudXNlKGdyb3VwSWNvbk1kUGx1Z2luKTtcbiAgICAgICAgbWQudXNlKHRhYnNNYXJrZG93blBsdWdpbik7XG4gICAgICAgIG1kLnVzZShmb290bm90ZSk7XG4gICAgICB9LFxuICAgIH0sXG5cbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yXG4gICAgcHdhOiB7XG4gICAgICB3b3JrYm94OiB7XG4gICAgICAgIC8vIGRlZmF1bHQgaXMgMk1CIGJ1dCB0aGUgc2VhcmNoIGluZGV4IGlzIG11Y2ggbGFyZ2VyXG4gICAgICAgIG1heGltdW1GaWxlU2l6ZVRvQ2FjaGVJbkJ5dGVzOiA2ICogMTAyNCAqIDEwMjQsXG4gICAgICB9LFxuICAgIH0sXG5cbiAgICB2aXRlOiB7XG4gICAgICBwbHVnaW5zOiBbXG4gICAgICAgIGxsbXN0eHQoKSxcbiAgICAgICAgcGx1Z2luLFxuICAgICAgICBWaXRlSW1hZ2VPcHRpbWl6ZXIoe1xuICAgICAgICAgIC8vIC8vIENvbmZpZ3VyZSBvcHRpbWl6YXRpb24gb3B0aW9ucyBmb3IgZGlmZmVyZW50IGltYWdlIGZvcm1hdHNcbiAgICAgICAgICAvLyBwbmc6IHtcbiAgICAgICAgICAvLyAgIHF1YWxpdHk6IDgwLFxuICAgICAgICAgIC8vIH0sXG4gICAgICAgICAgLy8ganBlZzoge1xuICAgICAgICAgIC8vICAgcXVhbGl0eTogNzUsXG4gICAgICAgICAgLy8gfSxcbiAgICAgICAgICAvLyB3ZWJwOiB7XG4gICAgICAgICAgLy8gICBxdWFsaXR5OiA4MCxcbiAgICAgICAgICAvLyB9LFxuICAgICAgICAgIC8vIGF2aWY6IHtcbiAgICAgICAgICAvLyAgIHF1YWxpdHk6IDcwLFxuICAgICAgICAgIC8vIH0sXG4gICAgICAgICAgLy8gc3ZnOiB7XG4gICAgICAgICAgLy8gICBwbHVnaW5zOiBbeyBuYW1lOiAncmVtb3ZlVmlld0JveCcsIGFjdGl2ZTogZmFsc2UgfSwgeyBuYW1lOiAnc29ydEF0dHJzJyB9XSxcbiAgICAgICAgICAvLyB9LFxuICAgICAgICB9KSBhcyB1bmtub3duIGFzIFBsdWdpbltdLFxuICAgICAgXSxcbiAgICB9LFxuXG4gICAgLy8ganVzdCB1bnRpbCB3ZSBoYXZlIHRoZSBndWlkZXMgYW5kIGRvY3MgaW4gYSBiZXR0ZXIgc3RhdGVcbiAgICBpZ25vcmVEZWFkTGlua3M6IGZhbHNlLFxuXG4gICAgLy8gdGhpcyB3b24ndCB3b3JrIHByb3Blcmx5IHVudGlsIHdlIGRvbid0IG5lZWQgdG8gc3luYyB0aGUgZ3VpZGVzXG4gICAgLy8gZnJvbSB0aGUgcmVwbyByb290IGludG8gdGhlIGRvY3Mtdmlld2VyXG4gICAgLy8gbGFzdFVwZGF0ZWQ6IHRydWUsXG5cbiAgICBoZWFkOiBbXG4gICAgICBbJ2xpbmsnLCB7IHJlbDogJ21hbmlmZXN0JywgaHJlZjogJy9zaXRlLndlYm1hbmlmZXN0JyB9XSxcbiAgICAgIFsnbGluaycsIHsgcmVsOiAnaWNvbicsIGhyZWY6ICcvZmF2aWNvbi5pY28nLCBzaXplczogJzMyeDMyJyB9XSxcbiAgICAgIFsnbGluaycsIHsgcmVsOiAnaWNvbicsIGhyZWY6ICcvbG9nb3Mvd2FycC1kcml2ZS9wcmVmZXJzLWNvbG9yLXcuc3ZnJywgdHlwZTogJ2ltYWdlL3N2Zyt4bWwnIH1dLFxuICAgICAgWydsaW5rJywgeyByZWw6ICdhcHBsZS10b3VjaC1pY29uJywgaHJlZjogJy9sb2dvcy9mYXZpY29uL2xvZ28teWVsbG93LXNxdWFyZS0xODB4MTgwLnBuZycsIHR5cGU6ICdpbWFnZS9wbmcnIH1dLFxuICAgICAgW1xuICAgICAgICAnbWV0YScsXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAna2V5d29yZHMnLFxuICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICAnZGF0YS1mcmFtZXdvcmsgZmV0Y2ggdHlwZXNjcmlwdCB0eXBlZCBSRVNUIGRhdGEtbG9hZGluZyBhcHBzIEdyYXBoUUwgSlNPTjpBUEkganNvbmFwaSBqc29uIHJlYWN0aXZpdHkgc2lnbmFscyBjcm9zcy1mcmFtZXdvcmsgTVBBIFNQQScsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgW1xuICAgICAgICAnbWV0YScsXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnZGVzY3JpcHRpb24nLFxuICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICAnV2FycERyaXZlIGlzIGEgbGlnaHR3ZWlnaHQgZGF0YSBsaWJyYXJ5IGZvciB3ZWIgYXBwcyBcdTIwMTQgdW5pdmVyc2FsLCB0eXBlZCwgcmVhY3RpdmUsIGFuZCByZWFkeSB0byBzY2FsZS4nLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIFtcbiAgICAgICAgJ21ldGEnLFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ2FwcGxlLW1vYmlsZS13ZWItYXBwLXRpdGxlJyxcbiAgICAgICAgICBjb250ZW50OiAnV2FycERyaXZlJyxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBbXG4gICAgICAgICdtZXRhJyxcbiAgICAgICAge1xuICAgICAgICAgIGl0ZW1wcm9wOiAnZGVzY3JpcHRpb24nLFxuICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICAnV2FycERyaXZlIGlzIGEgbGlnaHR3ZWlnaHQgZGF0YSBsaWJyYXJ5IGZvciB3ZWIgYXBwcyBcdTIwMTQgdW5pdmVyc2FsLCB0eXBlZCwgcmVhY3RpdmUsIGFuZCByZWFkeSB0byBzY2FsZS4nLFxuICAgICAgICB9LFxuICAgICAgXSxcblxuICAgICAgWydtZXRhJywgeyBwcm9wZXJ0eTogJ29nOnRpdGxlJywgY29udGVudDogJ1dhcnBEcml2ZScgfV0sXG4gICAgICBbJ21ldGEnLCB7IHByb3BlcnR5OiAnb2c6c2l0ZV9uYW1lJywgY29udGVudDogJ3dhcnAtZHJpdmUuaW8nIH1dLFxuICAgICAgWydtZXRhJywgeyBwcm9wZXJ0eTogJ29nOnR5cGUnLCBjb250ZW50OiAnd2Vic2l0ZScgfV0sXG4gICAgICBbXG4gICAgICAgICdtZXRhJyxcbiAgICAgICAge1xuICAgICAgICAgIHByb3BlcnR5OiAnb2c6ZGVzY3JpcHRpb24nLFxuICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICAnV2FycERyaXZlIGlzIGEgbGlnaHR3ZWlnaHQgZGF0YSBsaWJyYXJ5IGZvciB3ZWIgYXBwcyBcdTIwMTQgdW5pdmVyc2FsLCB0eXBlZCwgcmVhY3RpdmUsIGFuZCByZWFkeSB0byBzY2FsZS4nLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIFsnbWV0YScsIHsgcHJvcGVydHk6ICdvZzp1cmwnLCBjb250ZW50OiAnaHR0cHM6Ly93YXJwLWRyaXZlLmlvJyB9XSxcbiAgICAgIFsnbWV0YScsIHsgcHJvcGVydHk6ICdvZzppbWFnZScsIGNvbnRlbnQ6ICcvbG9nb3Mvd2FycC1kcml2ZS9naXRodWItaGVhZGVyLnBuZycgfV0sXG4gICAgICAvLyBbJ21ldGEnLCB7IHByb3BlcnR5OiAnb2c6aW1hZ2UnLCBjb250ZW50OiAnL2xvZ29zL3NvY2lhbDEucG5nJyB9XSxcbiAgICAgIC8vIFsnbWV0YScsIHsgcHJvcGVydHk6ICdvZzppbWFnZScsIGNvbnRlbnQ6ICcvbG9nb3Mvc29jaWFsMi5wbmcnIH1dLFxuICAgICAgLy8gW1xuICAgICAgLy8gICAnbGluaycsXG4gICAgICAvLyAgIHsgcmVsOiAncHJlY29ubmVjdCcsIGhyZWY6ICdodHRwczovL2ZvbnRzLmdvb2dsZWFwaXMuY29tJyB9XG4gICAgICAvLyBdLFxuICAgICAgLy8gW1xuICAgICAgLy8gICAnbGluaycsXG4gICAgICAvLyAgIHsgcmVsOiAncHJlY29ubmVjdCcsIGhyZWY6ICdodHRwczovL2ZvbnRzLmdzdGF0aWMuY29tJywgY3Jvc3NvcmlnaW46ICcnIH1cbiAgICAgIC8vIF0sXG4gICAgICAvLyBbXG4gICAgICAvLyAgICdsaW5rJyxcbiAgICAgIC8vICAgeyBocmVmOiAnaHR0cHM6Ly9mb250cy5nb29nbGVhcGlzLmNvbS9jc3MyP2ZhbWlseT1TeW5jb3BhdGU6d2dodEA0MDA7NzAwJmFtcDtkaXNwbGF5PXN3YXAnLCByZWw6ICdzdHlsZXNoZWV0JyB9XG4gICAgICAvLyBdXG4gICAgXSxcblxuICAgIC8vIGdpdGh1YiBwYWdlcyBzdXBwb3J0cyBjbGVhblVSTHNcbiAgICBjbGVhblVybHM6IHRydWUsXG4gICAgYmFzZTogcHJvY2Vzcy5lbnYuQkFTRSB8fCAnLycsXG5cbiAgICAvLyB3ZSB3YW50IHRvIHVzZSByZXdyaXRlcyBidXQgY2FuJ3QgaHR0cHM6Ly9naXRodWIuY29tL3Z1ZWpzL3ZpdGVwcmVzcy9pc3N1ZXMvNDM2NFxuICAgIC8vIHJld3JpdGVzOiBHdWlkZXNTdHJ1Y3R1cmUucmV3cml0dGVuLFxuXG4gICAgc2l0ZW1hcDoge1xuICAgICAgaG9zdG5hbWU6IHByb2Nlc3MuZW52LkhPU1ROQU1FIHx8ICdodHRwczovL2NhbmFyeS53YXJwLWRyaXZlLmlvJyxcbiAgICB9LFxuXG4gICAgdGhlbWVDb25maWc6IHtcbiAgICAgIHNpdGVUaXRsZTogZmFsc2UsXG4gICAgICBsb2dvOiB7XG4gICAgICAgIGRhcms6ICcvbG9nb3Mvd2FycC1kcml2ZS93b3JkLW1hcmstd2hpdGUuc3ZnJyxcbiAgICAgICAgbGlnaHQ6ICcvbG9nb3Mvd2FycC1kcml2ZS93YXJwLWRyaXZlLWxvZ28tZGFyay5zdmcnLFxuICAgICAgICBhbHQ6ICdXYXJwRHJpdmUnLFxuICAgICAgfSxcblxuICAgICAgLy8gaHR0cHM6Ly92aXRlcHJlc3MuZGV2L3JlZmVyZW5jZS9kZWZhdWx0LXRoZW1lLWNvbmZpZ1xuICAgICAgbmF2OiBbXG4gICAgICAgIHsgdGV4dDogJ0d1aWRlcycsIGxpbms6ICcvZ3VpZGVzJyB9LFxuICAgICAgICB7IHRleHQ6ICdBUEkgRG9jcycsIGxpbms6ICcvYXBpJyB9LFxuICAgICAgICB7IHRleHQ6ICdDb250cmlidXRpbmcnLCBsaW5rOiAnL2d1aWRlcy9jb250cmlidXRpbmcvYmVjb21lLWEtY29udHJpYnV0b3InIH0sXG4gICAgICBdLFxuXG4gICAgICBzaWRlYmFyOiBbXG4gICAgICAgIC4uLkd1aWRlc1N0cnVjdHVyZS5wYXRocyxcbiAgICAgICAge1xuICAgICAgICAgIHRleHQ6ICdBUEkgRG9jcycsXG4gICAgICAgICAgY29sbGFwc2VkOiB0cnVlLFxuICAgICAgICAgIC8vIGxpbms6ICcvYXBpLycsXG4gICAgICAgICAgaXRlbXM6IFtcbiAgICAgICAgICAgIHsgdGV4dDogJ1VuaXZlcnNhbCcgfSxcbiAgICAgICAgICAgIC4uLlR5cGVEb2NTaWRlYmFyLmNvcmVQYWNrYWdlcy5pdGVtcyxcbiAgICAgICAgICAgIHsgdGV4dDogJ0ZyYW1ld29ya3MnIH0sXG4gICAgICAgICAgICAuLi5UeXBlRG9jU2lkZWJhci5mcmFtZXdvcmtQYWNrYWdlcy5pdGVtcyxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgdGV4dDogJ0xlZ2FjeSBQYWNrYWdlcycsXG4gICAgICAgICAgY29sbGFwc2VkOiB0cnVlLFxuICAgICAgICAgIC8vIGxpbms6ICcvYXBpLycsXG4gICAgICAgICAgaXRlbXM6IFR5cGVEb2NTaWRlYmFyLm9sZFBhY2thZ2VzLFxuICAgICAgICB9LFxuICAgICAgXSxcblxuICAgICAgc29jaWFsTGlua3M6IFtcbiAgICAgICAgeyBpY29uOiAnZ2l0aHViJywgbGluazogJ2h0dHBzOi8vZ2l0aHViLmNvbS93YXJwLWRyaXZlLWRhdGEvd2FycC1kcml2ZScgfSxcbiAgICAgICAgeyBpY29uOiAnZGlzY29yZCcsIGxpbms6ICdodHRwczovL2Rpc2NvcmQuZ2cvUEhCYm5XSng1UycgfSxcbiAgICAgICAgeyBpY29uOiAnYmx1ZXNreScsIGxpbms6ICdodHRwczovL2Jza3kuYXBwL3Byb2ZpbGUvd2FycC1kcml2ZS5pbycgfSxcbiAgICAgIF0sXG5cbiAgICAgIGVkaXRMaW5rOiB7XG4gICAgICAgIHBhdHRlcm46ICdodHRwczovL2dpdGh1Yi5jb20vd2FycC1kcml2ZS1kYXRhL3dhcnAtZHJpdmUvZWRpdC9tYWluLzpwYXRoJyxcbiAgICAgIH0sXG5cbiAgICAgIHNlYXJjaDoge1xuICAgICAgICBwcm92aWRlcjogJ2xvY2FsJyxcbiAgICAgIH0sXG5cbiAgICAgIG91dGxpbmU6IHtcbiAgICAgICAgbGV2ZWw6IDIsXG4gICAgICB9LFxuXG4gICAgICBmb290ZXI6IHtcbiAgICAgICAgbWVzc2FnZTogJ1JlbGVhc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS4nLFxuICAgICAgICBjb3B5cmlnaHQ6IGBDb3B5cmlnaHQgJmNvcHk7IDIwMjUgRW1iZXIuanMgYW5kIENvbnRyaWJ1dG9yc2AsXG4gICAgICB9LFxuICAgIH0sXG4gIH0pXG4pO1xuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvbWVodWwvb3NzL2VtYmVyL2RhdGEvZG9jcy12aWV3ZXIvc3JjXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvbWVodWwvb3NzL2VtYmVyL2RhdGEvZG9jcy12aWV3ZXIvc3JjL3NpdGUtdXRpbHMudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL21laHVsL29zcy9lbWJlci9kYXRhL2RvY3Mtdmlld2VyL3NyYy9zaXRlLXV0aWxzLnRzXCI7aW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBnbG9iU3luYywgbWtkaXJTeW5jLCByZWFkRmlsZVN5bmMsIHJtU3luYywgd3JpdGVGaWxlU3luYyB9IGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IGZtIGZyb20gJ2Zyb250LW1hdHRlcic7XG5cbmNvbnN0IERlZmF1bHRPcGVuR3JvdXBzOiBzdHJpbmdbXSA9IFtdO1xuY29uc3QgQWx3YXlzT3Blbkdyb3Vwczogc3RyaW5nW10gPSBbXTtcblxuZnVuY3Rpb24gc2VnbWVudFRvVGl0bGUoc2VnbWVudDogc3RyaW5nLCBwcmV2U2VnbWVudDogc3RyaW5nIHwgbnVsbCkge1xuICBpZiAoc2VnbWVudCA9PT0gJ2luZGV4Lm1kJykge1xuICAgIGlmICghcHJldlNlZ21lbnQpIHJldHVybiAnSW50cm9kdWN0aW9uJztcbiAgICBzZWdtZW50ID0gcHJldlNlZ21lbnQ7XG4gIH1cbiAgY29uc3QgdmFsdWUgPSBzZWdtZW50LnNwbGl0KCctJykubWFwKChzKSA9PiBzLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgcy5zbGljZSgxKSk7XG4gIGlmICghaXNOYU4oTnVtYmVyKHZhbHVlWzBdKSkpIHtcbiAgICB2YWx1ZS5zaGlmdCgpO1xuICB9XG4gIGNvbnN0IHJlc3VsdCA9IHZhbHVlLmpvaW4oJyAnKS5yZXBsYWNlKCcubWQnLCAnJyk7XG5cbiAgcmV0dXJuIHJlc3VsdCA9PT0gJ0luZGV4JyA/ICdJbnRyb2R1Y3Rpb24nIDogcmVzdWx0O1xufVxuXG5pbnRlcmZhY2UgV2FycERyaXZlRnJvbnRNYXR0ZXIge1xuICBjYXRlZ29yeVRpdGxlPzogc3RyaW5nO1xuICB0aXRsZT86IHN0cmluZztcbiAgY2F0ZWdvcnlPcmRlcj86IG51bWJlcjtcbiAgb3JkZXI/OiBudW1iZXI7XG4gIGRyYWZ0PzogYm9vbGVhbjtcbiAgY29sbGFwc2VkPzogYm9vbGVhbjtcbn1cbmludGVyZmFjZSBHdWlkZUdyb3VwIHtcbiAgLyoqXG4gICAqIFRoZSBUZXh0IFRvIERpc3BsYXlcbiAgICovXG4gIHRleHQ6IHN0cmluZztcbiAgLyoqXG4gICAqIFRoZSBQYXRoIEZvciBUaGlzIGdyb3VwXG4gICAqIFwiT24gRGlzY1wiLlxuICAgKi9cbiAgcGF0aDogc3RyaW5nO1xuICAvKipcbiAgICogVGhlIFVSTCBTbHVnIEZvciBUaGlzIGdyb3VwXG4gICAqIGlmIGRpZmZlcmVudCBmcm9tIHRoZSBwYXRoLlxuICAgKlxuICAgKiBUaGlzIGlzIGN1cnJlbnRseSB1bnVzZWQgYnV0IGlzIHNldFxuICAgKiBieSB0aGUgZnJvbnRtYXR0ZXIgb2YgYW4gYGluZGV4Lm1kYCBmaWxlXG4gICAqIGluIHRoZSBkaXJlY3RvcnkuXG4gICAqL1xuICBzbHVnOiBzdHJpbmc7XG4gIC8qKlxuICAgKiBUaGlzIHdpbGwgYmUgdGhlIGNhdGVnb3J5SW5kZXggc3BlY2lmaWVkIGJ5XG4gICAqIHRoZSBmcm9udG1hdHRlciBvZiBhbiBgaW5kZXgubWRgIGZpbGUgaW4gdGhlIGRpcmVjdG9yeS5cbiAgICpcbiAgICogRWxzZSBpdCB3aWxsIGJlIHNldCB0byB0aGUgbmV4dCBvcGVuIGluZGV4IGF2YWlsYWJsZVxuICAgKiBvbmNlIFwia25vd25cIiBpbmRlY2VzIGhhdmUgYmVlbiBhc3NpZ25lZC5cbiAgICovXG4gIGluZGV4OiBudW1iZXIgfCBudWxsO1xuICAvKipcbiAgICogV2hldGhlciB0aGUgZGlyZWN0b3J5IHNob3VsZCBkZWZhdWx0IHRvIG9wZW4gb3IgY2xvc2VkLlxuICAgKlxuICAgKiBUaGlzIGlzIHNldCBieSB0aGUgZnJvbnRtYXR0ZXIgb2YgYW4gYGluZGV4Lm1kYCBmaWxlIGluIHRoZSBkaXJlY3RvcnkuXG4gICAqIGVsc2UgYnkgY29uZmlnIGFib3ZlIGluIHRoaXMgZmlsZSwgYW5kIGRlZmF1bHRzIHRvIGB0cnVlYC5cbiAgICovXG4gIGNvbGxhcHNlZDogYm9vbGVhbiB8IG51bGw7XG4gIC8qKlxuICAgKiBUaGUgY2hpbGQgaXRlbXMvZ3JvdXBzIG9mIHRoaXMgZ3JvdXAsIGlmIGFueS5cbiAgICovXG4gIGl0ZW1zOiBSZWNvcmQ8c3RyaW5nLCBHdWlkZUdyb3VwPjtcbiAgLyoqXG4gICAqXG4gICAqL1xuICBsaW5rPzogc3RyaW5nO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0R3VpZGVzU3RydWN0dXJlKCkge1xuICBjb25zdCBHdWlkZXNEaXJlY3RvcnlQYXRoID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uL2RvY3Mud2FycC1kcml2ZS5pby9ndWlkZXMnKTtcbiAgY29uc3QgZ2xvYiA9IGdsb2JTeW5jKCcqKi8qLm1kJywgeyBjd2Q6IEd1aWRlc0RpcmVjdG9yeVBhdGggfSk7XG4gIGNvbnN0IGdyb3VwczogUmVjb3JkPHN0cmluZywgR3VpZGVHcm91cD4gPSB7fTtcblxuICBmb3IgKGNvbnN0IGZpbGVwYXRoIG9mIGdsb2IpIHtcbiAgICBjb25zdCBzbHVnUGF0aCA9IFtdO1xuICAgIGNvbnN0IHRleHQgPSByZWFkRmlsZVN5bmMocGF0aC5qb2luKEd1aWRlc0RpcmVjdG9yeVBhdGgsIGZpbGVwYXRoKSwgJ3V0Zi04Jyk7XG4gICAgY29uc3QgZnJvbnRNYXR0ZXIgPSBmbTxXYXJwRHJpdmVGcm9udE1hdHRlcj4odGV4dCk7XG5cbiAgICBpZiAoZnJvbnRNYXR0ZXIuYXR0cmlidXRlcy5kcmFmdCkge1xuICAgICAgLy8gc2tpcCBoaWRkZW4gZmlsZXNcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChmaWxlcGF0aCA9PT0gJ2luZGV4Lm1kJykge1xuICAgICAgZ3JvdXBzWyd0aGUtbWFudWFsJ10gPSBncm91cHNbJ3RoZS1tYW51YWwnXSB8fCB7XG4gICAgICAgIHRleHQ6IGZyb250TWF0dGVyLmF0dHJpYnV0ZXMuY2F0ZWdvcnlUaXRsZSEsXG4gICAgICAgIHBhdGg6IGZpbGVwYXRoLFxuICAgICAgICBzbHVnOiBmaWxlcGF0aCxcbiAgICAgICAgaW5kZXg6IGZyb250TWF0dGVyLmF0dHJpYnV0ZXMuY2F0ZWdvcnlPcmRlciB8fCAwLFxuICAgICAgICBjb2xsYXBzZWQ6IGZyb250TWF0dGVyLmF0dHJpYnV0ZXMuY29sbGFwc2VkIHx8IHRydWUsXG4gICAgICAgIGxpbms6ICcvZ3VpZGVzL2luZGV4Lm1kJyxcbiAgICAgICAgaXRlbXM6IHt9LFxuICAgICAgfTtcbiAgICAgIE9iamVjdC5hc3NpZ24oZ3JvdXBzWyd0aGUtbWFudWFsJ10sIHtcbiAgICAgICAgdGV4dDogZnJvbnRNYXR0ZXIuYXR0cmlidXRlcy5jYXRlZ29yeVRpdGxlISxcbiAgICAgICAgaW5kZXg6IGZyb250TWF0dGVyLmF0dHJpYnV0ZXMuY2F0ZWdvcnlPcmRlciB8fCAwLFxuICAgICAgICBjb2xsYXBzZWQ6IGZyb250TWF0dGVyLmF0dHJpYnV0ZXMuY29sbGFwc2VkIHx8IHRydWUsXG4gICAgICAgIGxpbms6ICcvZ3VpZGVzL2luZGV4Lm1kJyxcbiAgICAgIH0pO1xuICAgICAgZ3JvdXBzWyd0aGUtbWFudWFsJ10uaXRlbXNbZmlsZXBhdGhdID0ge1xuICAgICAgICB0ZXh0OiBmcm9udE1hdHRlci5hdHRyaWJ1dGVzLnRpdGxlISxcbiAgICAgICAgcGF0aDogZmlsZXBhdGgsXG4gICAgICAgIHNsdWc6IGZpbGVwYXRoLFxuICAgICAgICBpbmRleDogZnJvbnRNYXR0ZXIuYXR0cmlidXRlcy5vcmRlciA/PyAwLFxuICAgICAgICBjb2xsYXBzZWQ6IGZhbHNlLFxuICAgICAgICBpdGVtczoge30sXG4gICAgICAgIGxpbms6ICcvZ3VpZGVzL2luZGV4Lm1kJyxcbiAgICAgIH07XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBzZWdtZW50cyA9IGZpbGVwYXRoLnNwbGl0KHBhdGguc2VwKTtcbiAgICBsZXQgbGFzdFNlZ21lbnQgPSBzZWdtZW50cy5wb3AoKSE7XG4gICAgbGV0IGlzSW5kZXggPSBmYWxzZTtcblxuICAgIGlmIChsYXN0U2VnbWVudCA9PT0gJ2luZGV4Lm1kJykge1xuICAgICAgLy8gd2UgdHJlYXQgaW5kZXggZmlsZXMgYXMgdGhlIG1haW4gZW50cnkgdG8gYW55IGd1aWRlcyBkaXJlY3RvcnlcbiAgICAgIGxhc3RTZWdtZW50ID0gc2VnbWVudHMucG9wKCkhO1xuXG4gICAgICBpZiAoIWxhc3RTZWdtZW50KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVG9wIExldmVsIEluZGV4Lm1kIGlzIG5vdCBhbGxvd2VkOiAke2ZpbGVwYXRofWApO1xuICAgICAgfVxuXG4gICAgICBpc0luZGV4ID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBsZXQgZ3JvdXAgPSBncm91cHM7XG4gICAgbGV0IHBhcmVudCA9IG51bGw7XG5cbiAgICAvLyBidWlsZCBvdXQgbm9kZXMgZm9yIGVhY2ggc2VnbWVudFxuICAgIC8vIGlmIHRoZXJlIGlzIG5vdCBvbmUgeWV0LlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2VnbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHByZXZTZWdtZW50ID0gaSA+IDAgPyBzZWdtZW50c1tpIC0gMV0gOiBudWxsO1xuICAgICAgY29uc3Qgc2VnbWVudCA9IHNlZ21lbnRzW2ldO1xuICAgICAgc2x1Z1BhdGgucHVzaChzZWdtZW50KTtcbiAgICAgIGNvbnN0IGtleSA9IHNsdWdQYXRoLmpvaW4oJy4nKTtcbiAgICAgIGNvbnN0IGNvbGxhcHNlZCA9IEFsd2F5c09wZW5Hcm91cHMuaW5jbHVkZXMoa2V5KSA/IG51bGwgOiBEZWZhdWx0T3Blbkdyb3Vwcy5pbmNsdWRlcyhrZXkpID8gZmFsc2UgOiB0cnVlO1xuXG4gICAgICAvLyBzZXR1cCBhIG5lc3RlZCBzZWdtZW50IGlmIHdlIGRvbid0IGFscmVhZHkgaGF2ZSBvbmVcbiAgICAgIGlmICghZ3JvdXBbc2VnbWVudF0pIHtcbiAgICAgICAgZ3JvdXBbc2VnbWVudF0gPSB7XG4gICAgICAgICAgdGV4dDogc2VnbWVudFRvVGl0bGUoc2VnbWVudCwgcHJldlNlZ21lbnQpLFxuICAgICAgICAgIGluZGV4OiBudWxsLFxuICAgICAgICAgIHBhdGg6IHNlZ21lbnQsXG4gICAgICAgICAgc2x1Zzogc2VnbWVudCxcbiAgICAgICAgICBjb2xsYXBzZWQsXG4gICAgICAgICAgaXRlbXM6IHt9LFxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICBwYXJlbnQgPSBncm91cFtzZWdtZW50XTtcbiAgICAgIGdyb3VwID0gZ3JvdXBbc2VnbWVudF0uaXRlbXMhO1xuICAgIH1cblxuICAgIHNsdWdQYXRoLnB1c2gobGFzdFNlZ21lbnQpO1xuICAgIGNvbnN0IGtleSA9IHNsdWdQYXRoLmpvaW4oJy4nKTtcbiAgICBjb25zdCByZWFsVXJsID0gYC9ndWlkZXMvJHtmaWxlcGF0aH1gO1xuXG4gICAgLy8gc2V0dXAgb3VyIGxlYWYtbW9zdCBzZWdtZW50IGZvciB0aGlzIGZpbGVcbiAgICAvLyBpZiBuZWVkZWQsIGl0IG1heSBleGlzdCBmcm9tIGEgY2hpbGQgZGlyZWN0b3J5IGFscmVhZHlcbiAgICBpZiAoIWdyb3VwW2xhc3RTZWdtZW50XSkge1xuICAgICAgZ3JvdXBbbGFzdFNlZ21lbnRdID0ge1xuICAgICAgICB0ZXh0OiBzZWdtZW50VG9UaXRsZShsYXN0U2VnbWVudCwgcGFyZW50ID8gcGFyZW50LnBhdGggOiBudWxsKSxcbiAgICAgICAgaW5kZXg6IG51bGwsXG4gICAgICAgIHBhdGg6IGxhc3RTZWdtZW50LFxuICAgICAgICBzbHVnOiBsYXN0U2VnbWVudCxcbiAgICAgICAgY29sbGFwc2VkOiBBbHdheXNPcGVuR3JvdXBzLmluY2x1ZGVzKGtleSkgPyBudWxsIDogRGVmYXVsdE9wZW5Hcm91cHMuaW5jbHVkZXMoa2V5KSA/IGZhbHNlIDogdHJ1ZSxcbiAgICAgICAgaXRlbXM6IHt9LFxuICAgICAgICAvLyBpZiB3ZSBhcmUgYW4gaW5kZXggZmlsZSwgdGhpcyBoYXMgdGhlIGVmZmVjdCBvZiBzZXR0aW5nIHRoZSBsaW5rIG9uIHRoZSBwYXJlbnQgbm9kZVxuICAgICAgICAvLyB0aGlzIHNlZW1zIHRvIHdvcmsgZXZlbiB0aG91Z2ggdGhlcmUncyBhbiBpc3N1ZVxuICAgICAgICAvLyB0aGF0IHNheXMgaXQgZG9lc24ndDogaHR0cHM6Ly9naXRodWIuY29tL3Z1ZWpzL3ZpdGVwcmVzcy9pc3N1ZXMvMjk4OVxuICAgICAgICAvLyBob3dldmVyOlxuICAgICAgICAvLyB3aGVuIGRvaW5nIHRoaXMsIHRoZSBcIm5leHQgcGFnZVwiIGZlYXR1cmUgYnJlYWtzIGZvclxuICAgICAgICAvLyB0aGVzZSBwYWdlcywgc28gZm9yIG5vdyB3ZSBqdXN0IGRvIG5vbi1jbGlja2FibGUgaGVhZGVycy5cbiAgICAgICAgbGluazogcmVhbFVybCxcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHRoZSBzZWdtZW50IHdhcyBwcmV2aW91c2x5IGdlbmVyYXRlZCBmcm9tIGEgZmlsZSBpbiBhIGNoaWxkIGRpcmVjdG9yeSBvbiB0aGUgc2FtZSBwYXRoLlxuICAgICAgLy8gd2UgbmVlZCB0byBhZGQgaW4gdGhlIGxpbmsuXG4gICAgICBncm91cFtsYXN0U2VnbWVudF0ubGluayA9IHJlYWxVcmw7XG4gICAgfVxuXG4gICAgLy8gdXBkYXRlIHRoZSBsZWFmLW1vc3Qgc2VnbWVudCB3aXRoIGFueSBmcm9udG1hdHRlciBpbmZvXG4gICAgY29uc3QgbGVhZiA9IGdyb3VwW2xhc3RTZWdtZW50XSE7XG5cbiAgICAvLyBpZiB0aGUgbGVhZiBpcyB0aGUgaW5kZXgsIHdlIG5lZWQgdG8gdXBkYXRlIHRoZSBjYXRlZ29yeSBlbnRyeVxuICAgIC8vIGFuZCB0aGVuIGdlbmVyYXRlIGFuIGl0ZW0gZW50cnkgZm9yIGl0LlxuICAgIGlmIChpc0luZGV4KSB7XG4gICAgICBpZiAoJ2NvbGxhcHNlZCcgaW4gZnJvbnRNYXR0ZXIuYXR0cmlidXRlcykge1xuICAgICAgICBsZWFmLmNvbGxhcHNlZCA9IGZyb250TWF0dGVyLmF0dHJpYnV0ZXMuY29sbGFwc2VkITtcbiAgICAgIH1cbiAgICAgIGlmICgnY2F0ZWdvcnlPcmRlcicgaW4gZnJvbnRNYXR0ZXIuYXR0cmlidXRlcykge1xuICAgICAgICBsZWFmLmluZGV4ID0gZnJvbnRNYXR0ZXIuYXR0cmlidXRlcy5jYXRlZ29yeU9yZGVyITtcbiAgICAgIH1cbiAgICAgIGlmICgnY2F0ZWdvcnlUaXRsZScgaW4gZnJvbnRNYXR0ZXIuYXR0cmlidXRlcykge1xuICAgICAgICBsZWFmLnRleHQgPSBmcm9udE1hdHRlci5hdHRyaWJ1dGVzLmNhdGVnb3J5VGl0bGUhO1xuICAgICAgfVxuXG4gICAgICAvLyBnZW5lcmF0ZSB0aGUgZW50cnkgZm9yIHRoZSBmaWxlIGl0c2VsZiB1bmxlc3Mgd2UgYXJlIGEgdG9wLWxldmVsIGluZGV4IGZpbGVcbiAgICAgIGxlYWYuaXRlbXNbJ2luZGV4Lm1kJ10gPSB7XG4gICAgICAgIHBhdGg6ICdpbmRleC5tZCcsXG4gICAgICAgIHNsdWc6ICdpbmRleC5tZCcsXG4gICAgICAgIGNvbGxhcHNlZDogZmFsc2UsXG4gICAgICAgIHRleHQ6IGZyb250TWF0dGVyLmF0dHJpYnV0ZXMudGl0bGUgPz8gJ092ZXJ2aWV3JyxcbiAgICAgICAgaW5kZXg6IGZyb250TWF0dGVyLmF0dHJpYnV0ZXMub3JkZXIgPz8gMCxcbiAgICAgICAgbGluazogZ3JvdXBbbGFzdFNlZ21lbnRdIS5saW5rLFxuICAgICAgICBpdGVtczoge30sXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyB1cGRhdGUgdGhlIGxlYWYncyB0aXRsZSBhbmQgb3JkZXJcbiAgICAgIGlmIChmcm9udE1hdHRlci5hdHRyaWJ1dGVzLnRpdGxlKSB7XG4gICAgICAgIGxlYWYudGV4dCA9IGZyb250TWF0dGVyLmF0dHJpYnV0ZXMudGl0bGU7XG4gICAgICB9XG4gICAgICBpZiAoJ29yZGVyJyBpbiBmcm9udE1hdHRlci5hdHRyaWJ1dGVzKSB7XG4gICAgICAgIGxlYWYuaW5kZXggPSBmcm9udE1hdHRlci5hdHRyaWJ1dGVzLm9yZGVyITtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBkZWVwIGl0ZXJhdGUgY29udmVydGluZyBpdGVtcyBvYmplY3RzIHRvIGFycmF5c1xuICBjb25zdCByZXN1bHQgPSBkZWVwQ29udmVydChncm91cHMpO1xuICAvLyBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShyZXN1bHQsIG51bGwsIDIpKTtcbiAgLy8gY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkocmV3cml0dGVuLCBudWxsLCAyKSk7XG4gIGNvbnN0IHN0cnVjdHVyZSA9IHsgcGF0aHM6IHJlc3VsdCB9O1xuXG4gIHdyaXRlRmlsZVN5bmMoXG4gICAgcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uL2RvY3Mud2FycC1kcml2ZS5pby9ndWlkZXMvbmF2Lmpzb24nKSxcbiAgICBKU09OLnN0cmluZ2lmeShzdHJ1Y3R1cmUsIG51bGwsIDIpLFxuICAgICd1dGYtOCdcbiAgKTtcbiAgYXdhaXQgaW1wb3J0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi9kb2NzLndhcnAtZHJpdmUuaW8vZ3VpZGVzL25hdi5qc29uJyksIHtcbiAgICB3aXRoOiB7IHR5cGU6ICdqc29uJyB9LFxuICB9KTtcblxuICByZXR1cm4geyBwYXRoczogcmVzdWx0IH07XG59XG5cbmZ1bmN0aW9uIGRlZXBDb252ZXJ0KG9iajogUmVjb3JkPHN0cmluZywgYW55Pikge1xuICBjb25zdCBncm91cHMgPSBBcnJheS5mcm9tKE9iamVjdC52YWx1ZXMob2JqKSk7XG4gIGNvbnN0IHNvcnRlZEdyb3VwcyA9IG5ldyBBcnJheShncm91cHMubGVuZ3RoKS5maWxsKG51bGwpO1xuXG4gIGZvciAoY29uc3QgZ3JvdXAgb2YgZ3JvdXBzKSB7XG4gICAgaWYgKGdyb3VwLmluZGV4ICE9PSBudWxsKSB7XG4gICAgICBpZiAoZ3JvdXAuaW5kZXggPCAwIHx8IGdyb3VwLmluZGV4ID49IGdyb3Vwcy5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGluZGV4ICR7Z3JvdXAuaW5kZXh9IGZvciAke2dyb3VwLnBhdGh9LCBtdXN0IGJlIGJldHdlZW4gMCBhbmQgJHtncm91cHMubGVuZ3RoIC0gMX1gKTtcbiAgICAgIH1cbiAgICAgIGlmIChzb3J0ZWRHcm91cHNbZ3JvdXAuaW5kZXhdICE9PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRHVwbGljYXRlIGluZGV4ICR7Z3JvdXAuaW5kZXh9IGZvciAke2dyb3VwLnBhdGh9LCBtYXRjaGVzICR7c29ydGVkR3JvdXBzW2dyb3VwLmluZGV4XX1gKTtcbiAgICAgIH1cbiAgICAgIHNvcnRlZEdyb3Vwc1tncm91cC5pbmRleF0gPSBncm91cDtcbiAgICB9XG5cbiAgICBkZWxldGUgZ3JvdXAucGF0aDtcbiAgICBkZWxldGUgZ3JvdXAuc2x1ZztcblxuICAgIGlmIChncm91cC5pdGVtcykge1xuICAgICAgaWYgKE9iamVjdC5rZXlzKGdyb3VwLml0ZW1zKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgZGVsZXRlIGdyb3VwLml0ZW1zO1xuICAgICAgICBkZWxldGUgZ3JvdXAuY29sbGFwc2VkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZ3JvdXAuaXRlbXMgPSBkZWVwQ29udmVydChncm91cC5pdGVtcyk7XG5cbiAgICAgICAgaWYgKCFncm91cC5saW5rICYmICFncm91cC5pdGVtc1swXS5pdGVtcykge1xuICAgICAgICAgIGdyb3VwLmxpbmsgPSBncm91cC5pdGVtc1swXS5saW5rO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZm9yIChjb25zdCBncm91cCBvZiBncm91cHMpIHtcbiAgICBpZiAoZ3JvdXAuaW5kZXggPT09IG51bGwpIHtcbiAgICAgIC8vIGZpbmQgdGhlIGZpcnN0IG51bGwgaW5kZXggYW5kIGluc2VydFxuICAgICAgY29uc3QgZmlyc3ROdWxsSW5kZXggPSBzb3J0ZWRHcm91cHMuZmluZEluZGV4KChnKSA9PiBnID09PSBudWxsKTtcbiAgICAgIGlmIChmaXJzdE51bGxJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgc29ydGVkR3JvdXBzW2ZpcnN0TnVsbEluZGV4XSA9IGdyb3VwO1xuICAgICAgICBncm91cC5pbmRleCA9IGZpcnN0TnVsbEluZGV4O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBzb3J0ZWRHcm91cHM7XG59XG5cbnR5cGUgU2lkZWJhckl0ZW0gPSB7IHRleHQ6IHN0cmluZzsgaXRlbXM/OiBTaWRlYmFySXRlbVtdOyBsaW5rPzogc3RyaW5nOyBjb2xsYXBzZWQ/OiBib29sZWFuIH07XG5cbmNvbnN0IE9MRF9QQUNLQUdFUyA9IFtcbiAgJ0BlbWJlci1kYXRhL2FkYXB0ZXInLFxuICAnQGVtYmVyLWRhdGEvYWN0aXZlLXJlY29yZCcsXG4gICdAZW1iZXItZGF0YS9kZWJ1ZycsXG4gICdAZW1iZXItZGF0YS9sZWdhY3ktY29tcGF0JyxcbiAgJ0BlbWJlci1kYXRhL21vZGVsJyxcbiAgJ0BlbWJlci1kYXRhL2pzb24tYXBpJyxcbiAgJ0BlbWJlci1kYXRhL3N0b3JlJyxcbiAgJ0BlbWJlci1kYXRhL2dyYXBoJyxcbiAgJ0BlbWJlci1kYXRhL3JlcXVlc3QnLFxuICAnQGVtYmVyLWRhdGEvcmVxdWVzdC11dGlscycsXG4gICdAZW1iZXItZGF0YS9yZXN0JyxcbiAgJ0BlbWJlci1kYXRhL3NlcmlhbGl6ZXInLFxuICAnQGVtYmVyLWRhdGEvdHJhY2tpbmcnLFxuICAnQHdhcnAtZHJpdmUvY29yZS10eXBlcycsXG4gICdAd2FycC1kcml2ZS9idWlsZC1jb25maWcnLFxuICAnQHdhcnAtZHJpdmUvc2NoZW1hLXJlY29yZCcsXG5dO1xuXG5jb25zdCBDT1JFX1BBQ0tBR0VTID0gW1xuICAnQHdhcnAtZHJpdmUvY29yZScsXG4gICdAd2FycC1kcml2ZS9leHBlcmltZW50cycsXG4gICdAd2FycC1kcml2ZS9qc29uLWFwaScsXG4gICdAd2FycC1kcml2ZS91dGlsaXRpZXMnLFxuICAnQHdhcnAtZHJpdmUvbGVnYWN5JyxcbiAgJ0B3YXJwLWRyaXZlL2hvbG9kZWNrJyxcbiAgJ2VzbGludC1wbHVnaW4td2FycC1kcml2ZScsXG5dO1xuXG5mdW5jdGlvbiBpc0ZyYW1ld29ya1BhY2thZ2UobmFtZTogc3RyaW5nKSB7XG4gIHJldHVybiAhT0xEX1BBQ0tBR0VTLmluY2x1ZGVzKG5hbWUpICYmICFDT1JFX1BBQ0tBR0VTLmluY2x1ZGVzKG5hbWUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3BsaXRBcGlEb2NzU2lkZWJhcihzaWRlYmFyOiBTaWRlYmFySXRlbVtdKSB7XG4gIGNvbnN0IG9sZFBhY2thZ2VzOiBTaWRlYmFySXRlbVtdID0gW107XG4gIGNvbnN0IGNvcmVQYWNrYWdlcyA9IHsgdGV4dDogJ1VuaXZlcnNhbCcsIGl0ZW1zOiBbXSBhcyBTaWRlYmFySXRlbVtdIH0gc2F0aXNmaWVzIFNpZGViYXJJdGVtO1xuICBjb25zdCBmcmFtZXdvcmtQYWNrYWdlcyA9IHsgdGV4dDogJ0ZyYW1ld29ya3MnLCBpdGVtczogW10gYXMgU2lkZWJhckl0ZW1bXSB9IHNhdGlzZmllcyBTaWRlYmFySXRlbTtcblxuICBmb3IgKGNvbnN0IGl0ZW0gb2Ygc2lkZWJhcikge1xuICAgIGlmIChPTERfUEFDS0FHRVMuaW5jbHVkZXMoaXRlbS50ZXh0KSkge1xuICAgICAgb2xkUGFja2FnZXMucHVzaChpdGVtKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGlzRnJhbWV3b3JrUGFja2FnZShpdGVtLnRleHQpKSB7XG4gICAgICAgIGZyYW1ld29ya1BhY2thZ2VzLml0ZW1zLnB1c2goaXRlbSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb3JlUGFja2FnZXMuaXRlbXMucHVzaChpdGVtKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIG9sZFBhY2thZ2VzLFxuICAgIGZyYW1ld29ya1BhY2thZ2VzLFxuICAgIGNvcmVQYWNrYWdlcyxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzQXBpRG9jc1NpZGViYXIobzogdW5rbm93bik6IHsgb2xkUGFja2FnZXM6IFNpZGViYXJJdGVtW107IG5ld1BhY2thZ2VzOiBTaWRlYmFySXRlbVtdIH0ge1xuICByZXR1cm4gbyBhcyB7IG9sZFBhY2thZ2VzOiBTaWRlYmFySXRlbVtdOyBuZXdQYWNrYWdlczogU2lkZWJhckl0ZW1bXSB9O1xufVxuXG5jb25zdCBIT0lTVEVEX1BSSU1JVElWRVMgPSBbJ0NsYXNzZXMnLCAnVmFyaWFibGVzJywgJ0Z1bmN0aW9ucyddO1xuY29uc3QgRklMVEVSRURfTkFWX0lURU1TID0gWydJbnRlcmZhY2VzJywgJ1R5cGUgQWxpYXNlcyddO1xuY29uc3QgTUVUQV9QQUNLQUdFUyA9IFsnZW1iZXItZGF0YScsICd3YXJwLWRyaXZlJywgJ2VzbGludC1wbHVnaW4tZW1iZXItZGF0YScsICdlc2xpbnQtcGx1Z2luLXdhcnAtZHJpdmUnXTtcblxuZnVuY3Rpb24gY2xlYW5TaWRlYmFySXRlbXMoaXRlbXM6IFNpZGViYXJJdGVtW10sIGlzUHJpbWl0aXZlID0gZmFsc2UpOiBTaWRlYmFySXRlbVtdIHtcbiAgY29uc3QgbmV3SXRlbXM6IFNpZGViYXJJdGVtW10gPSBbXTtcbiAgbGV0IHN1Ym1vZHVsZXM6IFNpZGViYXJJdGVtW10gPSBbXTtcblxuICBjb25zdCBob2lzdGVkOiBTaWRlYmFySXRlbSA9IHsgdGV4dDogJ2V4cG9ydHMnLCBpdGVtczogW10gfTtcblxuICBmb3IgKGNvbnN0IGl0ZW0gb2YgaXRlbXMpIHtcbiAgICBpZiAoRklMVEVSRURfTkFWX0lURU1TLmluY2x1ZGVzKGl0ZW0udGV4dCkpIHtcbiAgICAgIC8vIHNraXAgZmlsdGVyZWQgaXRlbXNcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChIT0lTVEVEX1BSSU1JVElWRVMuaW5jbHVkZXMoaXRlbS50ZXh0KSkge1xuICAgICAgaG9pc3RlZC5pdGVtcyEucHVzaCguLi5jbGVhblNpZGViYXJJdGVtcyhpdGVtLml0ZW1zIHx8IFtdLCB0cnVlKSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoaXRlbS50ZXh0ID09PSAnTW9kdWxlcycpIHtcbiAgICAgIC8vIGhvaXN0IG1vZHVsZXMgdXBcbiAgICAgIHN1Ym1vZHVsZXMgPSBjbGVhblNpZGViYXJJdGVtcyhpdGVtLml0ZW1zIHx8IFtdKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghTUVUQV9QQUNLQUdFUy5pbmNsdWRlcyhpdGVtLnRleHQpICYmICFpdGVtLnRleHQuc3RhcnRzV2l0aCgnQCcpICYmICFpc1ByaW1pdGl2ZSkge1xuICAgICAgaXRlbS50ZXh0ID0gJy8nICsgaXRlbS50ZXh0O1xuICAgIH1cblxuICAgIGlmIChpdGVtLml0ZW1zKSB7XG4gICAgICBpdGVtLml0ZW1zID0gY2xlYW5TaWRlYmFySXRlbXMoaXRlbS5pdGVtcyk7XG4gICAgfVxuICAgIG5ld0l0ZW1zLnB1c2goaXRlbSk7XG4gICAgY29udGludWU7XG4gIH1cblxuICBpZiAoc3VibW9kdWxlcy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gbmV3SXRlbXM7XG4gIH1cblxuICBpZiAoaG9pc3RlZC5pdGVtcyEubGVuZ3RoID4gMCkge1xuICAgIC8vIGlmIHdlIGhhdmUgaG9pc3RlZCBpdGVtcywgd2UgYWRkIHRoZW0gdG8gdGhlIG5ldyBpdGVtc1xuICAgIG5ld0l0ZW1zLnVuc2hpZnQoaG9pc3RlZCk7XG4gIH1cblxuICByZXR1cm4gbmV3SXRlbXMuY29uY2F0KHN1Ym1vZHVsZXMpO1xufVxuXG5jb25zdCBET0NfRlJPTlRNQVRURVIgPSBgLS0tXG5vdXRsaW5lOlxuICBsZXZlbDogWzIsIDNdXG4tLS1cbmA7XG5jb25zdCBBcGlEb2N1bWVudGF0aW9uID0gYCMgQVBJIERvY3NcXG5cXG5gO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcG9zdFByb2Nlc3NBcGlEb2NzKCkge1xuICBjb25zdCBkaXIgPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vdG1wL2FwaScpO1xuICBjb25zdCBvdXREaXIgPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vZG9jcy53YXJwLWRyaXZlLmlvL2FwaScpO1xuICBta2RpclN5bmMob3V0RGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcblxuICAvLyByZW1vdmUgdGhlIGBfbWVkaWFgIGRpcmVjdG9yeSB0aGF0IHR5cGVkb2MgZ2VuZXJhdGVzXG4gIHJtU3luYyhwYXRoLmpvaW4oZGlyLCAnX21lZGlhJyksIHsgcmVjdXJzaXZlOiB0cnVlLCBmb3JjZTogdHJ1ZSB9KTtcblxuICAvLyBjbGVhbnVwIGFuZCBwcmVwYXJlIHRoZSBzaWRlYmFyIGl0ZW1zXG4gIGNvbnN0IHNpZGViYXJQYXRoID0gcGF0aC5qb2luKG91dERpciwgJ3R5cGVkb2Mtc2lkZWJhci5qc29uJyk7XG4gIGNvbnN0IG5hdlN0cnVjdHVyZSA9IEpTT04ucGFyc2UocmVhZEZpbGVTeW5jKHBhdGguam9pbihkaXIsICd0eXBlZG9jLXNpZGViYXIuanNvbicpLCAndXRmLTgnKSkgYXMgU2lkZWJhckl0ZW1bXTtcbiAgY29uc3Qgc2lkZWJhciA9IHNwbGl0QXBpRG9jc1NpZGViYXIoY2xlYW5TaWRlYmFySXRlbXMobmF2U3RydWN0dXJlKSk7XG4gIHdyaXRlRmlsZVN5bmMoc2lkZWJhclBhdGgsIEpTT04uc3RyaW5naWZ5KHNpZGViYXIsIG51bGwsIDIpLCAndXRmLTgnKTtcblxuICAvLyBnZXQgdGhlIHBhY2thZ2UgbGlzdFxuICBjb25zdCBNYWluUGFja2FnZXM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IEZyYW1ld29ya1BhY2thZ2VzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBPbGRQYWNrYWdlczogc3RyaW5nW10gPSBbXTtcbiAgZm9yIChjb25zdCBpdGVtIG9mIHNpZGViYXIuY29yZVBhY2thZ2VzLml0ZW1zKSB7XG4gICAgTWFpblBhY2thZ2VzLnB1c2goYC0gWyR7aXRlbS50ZXh0fV0oJHtpdGVtLmxpbmshfSlgKTtcbiAgfVxuICBmb3IgKGNvbnN0IGl0ZW0gb2Ygc2lkZWJhci5mcmFtZXdvcmtQYWNrYWdlcy5pdGVtcykge1xuICAgIEZyYW1ld29ya1BhY2thZ2VzLnB1c2goYC0gWyR7aXRlbS50ZXh0fV0oJHtpdGVtLmxpbmshfSlgKTtcbiAgfVxuICBmb3IgKGNvbnN0IGl0ZW0gb2Ygc2lkZWJhci5vbGRQYWNrYWdlcykge1xuICAgIE9sZFBhY2thZ2VzLnB1c2goYC0gWyR7aXRlbS50ZXh0fV0oJHtpdGVtLmxpbmshfSlgKTtcbiAgfVxuXG4gIC8vIGdlbmVyYXRlIHRoZSBBUEkgZG9jdW1lbnRhdGlvblxuICBjb25zdCBhcGlEb2N1bWVudGF0aW9uID0gYCR7QXBpRG9jdW1lbnRhdGlvbn1cXG5cXG4jIyBNYWluIFBhY2thZ2VzXFxuXFxuJHtNYWluUGFja2FnZXMuam9pbignXFxuJyl9XFxuXFxuIyMgRnJhbWV3b3JrIFBhY2thZ2VzXFxuXFxuJHtGcmFtZXdvcmtQYWNrYWdlcy5qb2luKCdcXG4nKX1cXG5cXG4jIyBMZWdhY3kgUGFja2FnZXNcXG5cXG4ke09sZFBhY2thZ2VzLmpvaW4oJ1xcbicpfVxcblxcbmA7XG5cbiAgLy8gY29weSB0aGUgcmVzdCBvZiB0aGUgZmlsZXNcbiAgY29uc3QgZmlsZXMgPSBnbG9iU3luYygnKiovKi5tZCcsIHsgY3dkOiBkaXIsIG5vZGlyOiB0cnVlIH0pO1xuICBmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMpIHtcbiAgICBpZiAoZmlsZSA9PT0gJ2luZGV4Lm1kJykge1xuICAgICAgLy8gR2VuZXJhdGUgYSBjdXN0b20gaW5kZXgubWQgZmlsZVxuICAgICAgd3JpdGVGaWxlU3luYyhwYXRoLmpvaW4ob3V0RGlyLCAnaW5kZXgubWQnKSwgYXBpRG9jdW1lbnRhdGlvbiwgJ3V0Zi04Jyk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3QgY29udGVudCA9IHJlYWRGaWxlU3luYyhwYXRoLmpvaW4oZGlyLCBmaWxlKSwgJ3V0Zi04Jyk7XG4gICAgY29uc3Qgb3V0RmlsZSA9IHBhdGguam9pbihvdXREaXIsIGZpbGUpO1xuICAgIG1rZGlyU3luYyhwYXRoLmRpcm5hbWUob3V0RmlsZSksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuXG4gICAgbGV0IG5ld0NvbnRlbnQgPSBjb250ZW50O1xuXG4gICAgLy8gaWYgdGhlIGZpbGUgaXMgaW4gQHdhcnAtZHJpdmUvbGVnYWN5IGFkZCB0aGUgbGVnYWN5IGJhZGdlXG4gICAgaWYgKGZpbGUuaW5jbHVkZXMoJ0B3YXJwLWRyaXZlL2xlZ2FjeScpKSB7XG4gICAgICBuZXdDb250ZW50ID0gYDxCYWRnZSB0eXBlPVwiZGFuZ2VyXCIgdGV4dD1cIkBsZWdhY3lcIiAvPjxicj48YnI+YCArIGNvbnRlbnQ7XG4gICAgfVxuXG4gICAgLy8gaW5zZXJ0IGZyb250bWF0dGVyXG4gICAgbmV3Q29udGVudCA9IERPQ19GUk9OVE1BVFRFUiArIG5ld0NvbnRlbnQ7XG5cbiAgICAvLyBpZiB0aGUgY29udGVudCBoYXMgYSBtb2R1bGVzIGxpc3QsIHdlIHJlbW92ZSBpdFxuICAgIGlmIChuZXdDb250ZW50LmluY2x1ZGVzKCcjIyBNb2R1bGVzJykpIHtcbiAgICAgIG5ld0NvbnRlbnQgPSBuZXdDb250ZW50LnNsaWNlKDAsIG5ld0NvbnRlbnQuaW5kZXhPZignIyMgTW9kdWxlcycpKTtcbiAgICB9XG5cbiAgICAvLyBpZiB0aGUgY29udGVudCBoYXMgYEludGVyZmFjZWAgb3IgYFR5cGUgQWxpYXNlc2Agd2UgY29sbGFwc2UgdGhlbVxuICAgIGNvbnN0IGhhc0ludGVyZmFjZXMgPSBuZXdDb250ZW50LmluY2x1ZGVzKCcjIyBJbnRlcmZhY2VzJyk7XG4gICAgY29uc3QgaGFzVHlwZUFsaWFzZXMgPSBuZXdDb250ZW50LmluY2x1ZGVzKCcjIyBUeXBlIEFsaWFzZXMnKTtcbiAgICBpZiAoaGFzSW50ZXJmYWNlcykge1xuICAgICAgbmV3Q29udGVudCA9IG5ld0NvbnRlbnQucmVwbGFjZSgnIyMgSW50ZXJmYWNlcycsICcjIyBUeXBlcycpO1xuICAgICAgbmV3Q29udGVudCA9IG5ld0NvbnRlbnQucmVwbGFjZSgnXFxuXFxuIyMgVHlwZSBBbGlhc2VzXFxuJywgJycpO1xuICAgIH0gZWxzZSBpZiAoaGFzVHlwZUFsaWFzZXMpIHtcbiAgICAgIG5ld0NvbnRlbnQgPSBuZXdDb250ZW50LnJlcGxhY2UoJyMjIFR5cGUgQWxpYXNlcycsICcjIyBUeXBlcycpO1xuICAgIH1cblxuICAgIC8vIGlmIHRoZSBjb250ZW50IGhhcyBgUHJvcGVydGllc2AgYW5kIGBBY2Nlc3NvcnNgIHdlIGNvbGxhcHNlIHRoZW1cbiAgICBjb25zdCBoYXNQcm9wZXJ0aWVzID0gbmV3Q29udGVudC5pbmNsdWRlcygnIyMgUHJvcGVydGllcycpO1xuICAgIGNvbnN0IGhhc0FjY2Vzc29ycyA9IG5ld0NvbnRlbnQuaW5jbHVkZXMoJyMjIEFjY2Vzc29ycycpO1xuICAgIGlmIChoYXNBY2Nlc3NvcnMpIHtcbiAgICAgIGlmIChoYXNQcm9wZXJ0aWVzKSB7XG4gICAgICAgIG5ld0NvbnRlbnQgPSBuZXdDb250ZW50LnJlcGxhY2UoJ1xcblxcbiMjIEFjY2Vzc29yc1xcbicsICcnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5ld0NvbnRlbnQgPSBuZXdDb250ZW50LnJlcGxhY2UoJyMjIEFjY2Vzc29ycycsICcjIyBQcm9wZXJ0aWVzJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgd3JpdGVGaWxlU3luYyhvdXRGaWxlLCBuZXdDb250ZW50LCAndXRmLTgnKTtcbiAgfVxuXG4gIGF3YWl0IGltcG9ydChzaWRlYmFyUGF0aCwge1xuICAgIHdpdGg6IHsgdHlwZTogJ2pzb24nIH0sXG4gIH0pO1xuXG4gIHJldHVybiBzaWRlYmFyO1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5WCxTQUFTLGVBQWU7QUFDalosU0FBUyxvQkFBaUM7OztBQ0R1USxPQUFPLFVBQVU7QUFDbFUsU0FBUyxVQUFVLFdBQVcsY0FBYyxRQUFRLHFCQUFxQjtBQUN6RSxPQUFPLFFBQVE7QUFGZixJQUFNLG1DQUFtQztBQUl6QyxJQUFNLG9CQUE4QixDQUFDO0FBQ3JDLElBQU0sbUJBQTZCLENBQUM7QUFFcEMsU0FBUyxlQUFlLFNBQWlCLGFBQTRCO0FBQ25FLE1BQUksWUFBWSxZQUFZO0FBQzFCLFFBQUksQ0FBQyxZQUFhLFFBQU87QUFDekIsY0FBVTtBQUFBLEVBQ1o7QUFDQSxRQUFNLFFBQVEsUUFBUSxNQUFNLEdBQUcsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxFQUFFLFlBQVksSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ2xGLE1BQUksQ0FBQyxNQUFNLE9BQU8sTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHO0FBQzVCLFVBQU0sTUFBTTtBQUFBLEVBQ2Q7QUFDQSxRQUFNLFNBQVMsTUFBTSxLQUFLLEdBQUcsRUFBRSxRQUFRLE9BQU8sRUFBRTtBQUVoRCxTQUFPLFdBQVcsVUFBVSxpQkFBaUI7QUFDL0M7QUFzREEsZUFBc0IscUJBQXFCO0FBQ3pDLFFBQU0sc0JBQXNCLEtBQUssS0FBSyxrQ0FBVyw4QkFBOEI7QUFDL0UsUUFBTSxPQUFPLFNBQVMsV0FBVyxFQUFFLEtBQUssb0JBQW9CLENBQUM7QUFDN0QsUUFBTSxTQUFxQyxDQUFDO0FBRTVDLGFBQVcsWUFBWSxNQUFNO0FBQzNCLFVBQU0sV0FBVyxDQUFDO0FBQ2xCLFVBQU0sT0FBTyxhQUFhLEtBQUssS0FBSyxxQkFBcUIsUUFBUSxHQUFHLE9BQU87QUFDM0UsVUFBTSxjQUFjLEdBQXlCLElBQUk7QUFFakQsUUFBSSxZQUFZLFdBQVcsT0FBTztBQUVoQztBQUFBLElBQ0Y7QUFFQSxRQUFJLGFBQWEsWUFBWTtBQUMzQixhQUFPLFlBQVksSUFBSSxPQUFPLFlBQVksS0FBSztBQUFBLFFBQzdDLE1BQU0sWUFBWSxXQUFXO0FBQUEsUUFDN0IsTUFBTTtBQUFBLFFBQ04sTUFBTTtBQUFBLFFBQ04sT0FBTyxZQUFZLFdBQVcsaUJBQWlCO0FBQUEsUUFDL0MsV0FBVyxZQUFZLFdBQVcsYUFBYTtBQUFBLFFBQy9DLE1BQU07QUFBQSxRQUNOLE9BQU8sQ0FBQztBQUFBLE1BQ1Y7QUFDQSxhQUFPLE9BQU8sT0FBTyxZQUFZLEdBQUc7QUFBQSxRQUNsQyxNQUFNLFlBQVksV0FBVztBQUFBLFFBQzdCLE9BQU8sWUFBWSxXQUFXLGlCQUFpQjtBQUFBLFFBQy9DLFdBQVcsWUFBWSxXQUFXLGFBQWE7QUFBQSxRQUMvQyxNQUFNO0FBQUEsTUFDUixDQUFDO0FBQ0QsYUFBTyxZQUFZLEVBQUUsTUFBTSxRQUFRLElBQUk7QUFBQSxRQUNyQyxNQUFNLFlBQVksV0FBVztBQUFBLFFBQzdCLE1BQU07QUFBQSxRQUNOLE1BQU07QUFBQSxRQUNOLE9BQU8sWUFBWSxXQUFXLFNBQVM7QUFBQSxRQUN2QyxXQUFXO0FBQUEsUUFDWCxPQUFPLENBQUM7QUFBQSxRQUNSLE1BQU07QUFBQSxNQUNSO0FBQ0E7QUFBQSxJQUNGO0FBRUEsVUFBTSxXQUFXLFNBQVMsTUFBTSxLQUFLLEdBQUc7QUFDeEMsUUFBSSxjQUFjLFNBQVMsSUFBSTtBQUMvQixRQUFJLFVBQVU7QUFFZCxRQUFJLGdCQUFnQixZQUFZO0FBRTlCLG9CQUFjLFNBQVMsSUFBSTtBQUUzQixVQUFJLENBQUMsYUFBYTtBQUNoQixjQUFNLElBQUksTUFBTSxzQ0FBc0MsUUFBUSxFQUFFO0FBQUEsTUFDbEU7QUFFQSxnQkFBVTtBQUFBLElBQ1o7QUFFQSxRQUFJLFFBQVE7QUFDWixRQUFJLFNBQVM7QUFJYixhQUFTLElBQUksR0FBRyxJQUFJLFNBQVMsUUFBUSxLQUFLO0FBQ3hDLFlBQU0sY0FBYyxJQUFJLElBQUksU0FBUyxJQUFJLENBQUMsSUFBSTtBQUM5QyxZQUFNLFVBQVUsU0FBUyxDQUFDO0FBQzFCLGVBQVMsS0FBSyxPQUFPO0FBQ3JCLFlBQU1BLE9BQU0sU0FBUyxLQUFLLEdBQUc7QUFDN0IsWUFBTSxZQUFZLGlCQUFpQixTQUFTQSxJQUFHLElBQUksT0FBTyxrQkFBa0IsU0FBU0EsSUFBRyxJQUFJLFFBQVE7QUFHcEcsVUFBSSxDQUFDLE1BQU0sT0FBTyxHQUFHO0FBQ25CLGNBQU0sT0FBTyxJQUFJO0FBQUEsVUFDZixNQUFNLGVBQWUsU0FBUyxXQUFXO0FBQUEsVUFDekMsT0FBTztBQUFBLFVBQ1AsTUFBTTtBQUFBLFVBQ04sTUFBTTtBQUFBLFVBQ047QUFBQSxVQUNBLE9BQU8sQ0FBQztBQUFBLFFBQ1Y7QUFBQSxNQUNGO0FBRUEsZUFBUyxNQUFNLE9BQU87QUFDdEIsY0FBUSxNQUFNLE9BQU8sRUFBRTtBQUFBLElBQ3pCO0FBRUEsYUFBUyxLQUFLLFdBQVc7QUFDekIsVUFBTSxNQUFNLFNBQVMsS0FBSyxHQUFHO0FBQzdCLFVBQU0sVUFBVSxXQUFXLFFBQVE7QUFJbkMsUUFBSSxDQUFDLE1BQU0sV0FBVyxHQUFHO0FBQ3ZCLFlBQU0sV0FBVyxJQUFJO0FBQUEsUUFDbkIsTUFBTSxlQUFlLGFBQWEsU0FBUyxPQUFPLE9BQU8sSUFBSTtBQUFBLFFBQzdELE9BQU87QUFBQSxRQUNQLE1BQU07QUFBQSxRQUNOLE1BQU07QUFBQSxRQUNOLFdBQVcsaUJBQWlCLFNBQVMsR0FBRyxJQUFJLE9BQU8sa0JBQWtCLFNBQVMsR0FBRyxJQUFJLFFBQVE7QUFBQSxRQUM3RixPQUFPLENBQUM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxRQU9SLE1BQU07QUFBQSxNQUNSO0FBQUEsSUFDRixPQUFPO0FBR0wsWUFBTSxXQUFXLEVBQUUsT0FBTztBQUFBLElBQzVCO0FBR0EsVUFBTSxPQUFPLE1BQU0sV0FBVztBQUk5QixRQUFJLFNBQVM7QUFDWCxVQUFJLGVBQWUsWUFBWSxZQUFZO0FBQ3pDLGFBQUssWUFBWSxZQUFZLFdBQVc7QUFBQSxNQUMxQztBQUNBLFVBQUksbUJBQW1CLFlBQVksWUFBWTtBQUM3QyxhQUFLLFFBQVEsWUFBWSxXQUFXO0FBQUEsTUFDdEM7QUFDQSxVQUFJLG1CQUFtQixZQUFZLFlBQVk7QUFDN0MsYUFBSyxPQUFPLFlBQVksV0FBVztBQUFBLE1BQ3JDO0FBR0EsV0FBSyxNQUFNLFVBQVUsSUFBSTtBQUFBLFFBQ3ZCLE1BQU07QUFBQSxRQUNOLE1BQU07QUFBQSxRQUNOLFdBQVc7QUFBQSxRQUNYLE1BQU0sWUFBWSxXQUFXLFNBQVM7QUFBQSxRQUN0QyxPQUFPLFlBQVksV0FBVyxTQUFTO0FBQUEsUUFDdkMsTUFBTSxNQUFNLFdBQVcsRUFBRztBQUFBLFFBQzFCLE9BQU8sQ0FBQztBQUFBLE1BQ1Y7QUFBQSxJQUNGLE9BQU87QUFFTCxVQUFJLFlBQVksV0FBVyxPQUFPO0FBQ2hDLGFBQUssT0FBTyxZQUFZLFdBQVc7QUFBQSxNQUNyQztBQUNBLFVBQUksV0FBVyxZQUFZLFlBQVk7QUFDckMsYUFBSyxRQUFRLFlBQVksV0FBVztBQUFBLE1BQ3RDO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFHQSxRQUFNLFNBQVMsWUFBWSxNQUFNO0FBR2pDLFFBQU0sWUFBWSxFQUFFLE9BQU8sT0FBTztBQUVsQztBQUFBLElBQ0UsS0FBSyxLQUFLLGtDQUFXLHVDQUF1QztBQUFBLElBQzVELEtBQUssVUFBVSxXQUFXLE1BQU0sQ0FBQztBQUFBLElBQ2pDO0FBQUEsRUFDRjtBQUNBLFFBQU0sT0FBTyxLQUFLLEtBQUssa0NBQVcsdUNBQXVDLEdBQUc7QUFBQSxJQUMxRSxNQUFNLEVBQUUsTUFBTSxPQUFPO0FBQUEsRUFDdkI7QUFFQSxTQUFPLEVBQUUsT0FBTyxPQUFPO0FBQ3pCO0FBRUEsU0FBUyxZQUFZLEtBQTBCO0FBQzdDLFFBQU0sU0FBUyxNQUFNLEtBQUssT0FBTyxPQUFPLEdBQUcsQ0FBQztBQUM1QyxRQUFNLGVBQWUsSUFBSSxNQUFNLE9BQU8sTUFBTSxFQUFFLEtBQUssSUFBSTtBQUV2RCxhQUFXLFNBQVMsUUFBUTtBQUMxQixRQUFJLE1BQU0sVUFBVSxNQUFNO0FBQ3hCLFVBQUksTUFBTSxRQUFRLEtBQUssTUFBTSxTQUFTLE9BQU8sUUFBUTtBQUNuRCxjQUFNLElBQUksTUFBTSxpQkFBaUIsTUFBTSxLQUFLLFFBQVEsTUFBTSxJQUFJLDJCQUEyQixPQUFPLFNBQVMsQ0FBQyxFQUFFO0FBQUEsTUFDOUc7QUFDQSxVQUFJLGFBQWEsTUFBTSxLQUFLLE1BQU0sTUFBTTtBQUN0QyxjQUFNLElBQUksTUFBTSxtQkFBbUIsTUFBTSxLQUFLLFFBQVEsTUFBTSxJQUFJLGFBQWEsYUFBYSxNQUFNLEtBQUssQ0FBQyxFQUFFO0FBQUEsTUFDMUc7QUFDQSxtQkFBYSxNQUFNLEtBQUssSUFBSTtBQUFBLElBQzlCO0FBRUEsV0FBTyxNQUFNO0FBQ2IsV0FBTyxNQUFNO0FBRWIsUUFBSSxNQUFNLE9BQU87QUFDZixVQUFJLE9BQU8sS0FBSyxNQUFNLEtBQUssRUFBRSxXQUFXLEdBQUc7QUFDekMsZUFBTyxNQUFNO0FBQ2IsZUFBTyxNQUFNO0FBQUEsTUFDZixPQUFPO0FBQ0wsY0FBTSxRQUFRLFlBQVksTUFBTSxLQUFLO0FBRXJDLFlBQUksQ0FBQyxNQUFNLFFBQVEsQ0FBQyxNQUFNLE1BQU0sQ0FBQyxFQUFFLE9BQU87QUFDeEMsZ0JBQU0sT0FBTyxNQUFNLE1BQU0sQ0FBQyxFQUFFO0FBQUEsUUFDOUI7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFFQSxhQUFXLFNBQVMsUUFBUTtBQUMxQixRQUFJLE1BQU0sVUFBVSxNQUFNO0FBRXhCLFlBQU0saUJBQWlCLGFBQWEsVUFBVSxDQUFDLE1BQU0sTUFBTSxJQUFJO0FBQy9ELFVBQUksbUJBQW1CLElBQUk7QUFDekIscUJBQWEsY0FBYyxJQUFJO0FBQy9CLGNBQU0sUUFBUTtBQUFBLE1BQ2hCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFFQSxTQUFPO0FBQ1Q7QUFJQSxJQUFNLGVBQWU7QUFBQSxFQUNuQjtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUNGO0FBRUEsSUFBTSxnQkFBZ0I7QUFBQSxFQUNwQjtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUNGO0FBRUEsU0FBUyxtQkFBbUIsTUFBYztBQUN4QyxTQUFPLENBQUMsYUFBYSxTQUFTLElBQUksS0FBSyxDQUFDLGNBQWMsU0FBUyxJQUFJO0FBQ3JFO0FBRU8sU0FBUyxvQkFBb0IsU0FBd0I7QUFDMUQsUUFBTSxjQUE2QixDQUFDO0FBQ3BDLFFBQU0sZUFBZSxFQUFFLE1BQU0sYUFBYSxPQUFPLENBQUMsRUFBbUI7QUFDckUsUUFBTSxvQkFBb0IsRUFBRSxNQUFNLGNBQWMsT0FBTyxDQUFDLEVBQW1CO0FBRTNFLGFBQVcsUUFBUSxTQUFTO0FBQzFCLFFBQUksYUFBYSxTQUFTLEtBQUssSUFBSSxHQUFHO0FBQ3BDLGtCQUFZLEtBQUssSUFBSTtBQUFBLElBQ3ZCLE9BQU87QUFDTCxVQUFJLG1CQUFtQixLQUFLLElBQUksR0FBRztBQUNqQywwQkFBa0IsTUFBTSxLQUFLLElBQUk7QUFBQSxNQUNuQyxPQUFPO0FBQ0wscUJBQWEsTUFBTSxLQUFLLElBQUk7QUFBQSxNQUM5QjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBRUEsU0FBTztBQUFBLElBQ0w7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0Y7QUFDRjtBQU1BLElBQU0scUJBQXFCLENBQUMsV0FBVyxhQUFhLFdBQVc7QUFDL0QsSUFBTSxxQkFBcUIsQ0FBQyxjQUFjLGNBQWM7QUFDeEQsSUFBTSxnQkFBZ0IsQ0FBQyxjQUFjLGNBQWMsNEJBQTRCLDBCQUEwQjtBQUV6RyxTQUFTLGtCQUFrQixPQUFzQixjQUFjLE9BQXNCO0FBQ25GLFFBQU0sV0FBMEIsQ0FBQztBQUNqQyxNQUFJLGFBQTRCLENBQUM7QUFFakMsUUFBTSxVQUF1QixFQUFFLE1BQU0sV0FBVyxPQUFPLENBQUMsRUFBRTtBQUUxRCxhQUFXLFFBQVEsT0FBTztBQUN4QixRQUFJLG1CQUFtQixTQUFTLEtBQUssSUFBSSxHQUFHO0FBRTFDO0FBQUEsSUFDRjtBQUVBLFFBQUksbUJBQW1CLFNBQVMsS0FBSyxJQUFJLEdBQUc7QUFDMUMsY0FBUSxNQUFPLEtBQUssR0FBRyxrQkFBa0IsS0FBSyxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUM7QUFDaEU7QUFBQSxJQUNGO0FBRUEsUUFBSSxLQUFLLFNBQVMsV0FBVztBQUUzQixtQkFBYSxrQkFBa0IsS0FBSyxTQUFTLENBQUMsQ0FBQztBQUMvQztBQUFBLElBQ0Y7QUFFQSxRQUFJLENBQUMsY0FBYyxTQUFTLEtBQUssSUFBSSxLQUFLLENBQUMsS0FBSyxLQUFLLFdBQVcsR0FBRyxLQUFLLENBQUMsYUFBYTtBQUNwRixXQUFLLE9BQU8sTUFBTSxLQUFLO0FBQUEsSUFDekI7QUFFQSxRQUFJLEtBQUssT0FBTztBQUNkLFdBQUssUUFBUSxrQkFBa0IsS0FBSyxLQUFLO0FBQUEsSUFDM0M7QUFDQSxhQUFTLEtBQUssSUFBSTtBQUNsQjtBQUFBLEVBQ0Y7QUFFQSxNQUFJLFdBQVcsV0FBVyxHQUFHO0FBQzNCLFdBQU87QUFBQSxFQUNUO0FBRUEsTUFBSSxRQUFRLE1BQU8sU0FBUyxHQUFHO0FBRTdCLGFBQVMsUUFBUSxPQUFPO0FBQUEsRUFDMUI7QUFFQSxTQUFPLFNBQVMsT0FBTyxVQUFVO0FBQ25DO0FBRUEsSUFBTSxrQkFBa0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUt4QixJQUFNLG1CQUFtQjtBQUFBO0FBQUE7QUFFekIsZUFBc0IscUJBQXFCO0FBQ3pDLFFBQU0sTUFBTSxLQUFLLEtBQUssa0NBQVcsWUFBWTtBQUM3QyxRQUFNLFNBQVMsS0FBSyxLQUFLLGtDQUFXLDJCQUEyQjtBQUMvRCxZQUFVLFFBQVEsRUFBRSxXQUFXLEtBQUssQ0FBQztBQUdyQyxTQUFPLEtBQUssS0FBSyxLQUFLLFFBQVEsR0FBRyxFQUFFLFdBQVcsTUFBTSxPQUFPLEtBQUssQ0FBQztBQUdqRSxRQUFNLGNBQWMsS0FBSyxLQUFLLFFBQVEsc0JBQXNCO0FBQzVELFFBQU0sZUFBZSxLQUFLLE1BQU0sYUFBYSxLQUFLLEtBQUssS0FBSyxzQkFBc0IsR0FBRyxPQUFPLENBQUM7QUFDN0YsUUFBTSxVQUFVLG9CQUFvQixrQkFBa0IsWUFBWSxDQUFDO0FBQ25FLGdCQUFjLGFBQWEsS0FBSyxVQUFVLFNBQVMsTUFBTSxDQUFDLEdBQUcsT0FBTztBQUdwRSxRQUFNLGVBQXlCLENBQUM7QUFDaEMsUUFBTSxvQkFBOEIsQ0FBQztBQUNyQyxRQUFNLGNBQXdCLENBQUM7QUFDL0IsYUFBVyxRQUFRLFFBQVEsYUFBYSxPQUFPO0FBQzdDLGlCQUFhLEtBQUssTUFBTSxLQUFLLElBQUksS0FBSyxLQUFLLElBQUssR0FBRztBQUFBLEVBQ3JEO0FBQ0EsYUFBVyxRQUFRLFFBQVEsa0JBQWtCLE9BQU87QUFDbEQsc0JBQWtCLEtBQUssTUFBTSxLQUFLLElBQUksS0FBSyxLQUFLLElBQUssR0FBRztBQUFBLEVBQzFEO0FBQ0EsYUFBVyxRQUFRLFFBQVEsYUFBYTtBQUN0QyxnQkFBWSxLQUFLLE1BQU0sS0FBSyxJQUFJLEtBQUssS0FBSyxJQUFLLEdBQUc7QUFBQSxFQUNwRDtBQUdBLFFBQU0sbUJBQW1CLEdBQUcsZ0JBQWdCO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFBMkIsYUFBYSxLQUFLLElBQUksQ0FBQztBQUFBO0FBQUE7QUFBQTtBQUFBLEVBQWdDLGtCQUFrQixLQUFLLElBQUksQ0FBQztBQUFBO0FBQUE7QUFBQTtBQUFBLEVBQTZCLFlBQVksS0FBSyxJQUFJLENBQUM7QUFBQTtBQUFBO0FBRzdNLFFBQU0sUUFBUSxTQUFTLFdBQVcsRUFBRSxLQUFLLEtBQUssT0FBTyxLQUFLLENBQUM7QUFDM0QsYUFBVyxRQUFRLE9BQU87QUFDeEIsUUFBSSxTQUFTLFlBQVk7QUFFdkIsb0JBQWMsS0FBSyxLQUFLLFFBQVEsVUFBVSxHQUFHLGtCQUFrQixPQUFPO0FBQ3RFO0FBQUEsSUFDRjtBQUNBLFVBQU0sVUFBVSxhQUFhLEtBQUssS0FBSyxLQUFLLElBQUksR0FBRyxPQUFPO0FBQzFELFVBQU0sVUFBVSxLQUFLLEtBQUssUUFBUSxJQUFJO0FBQ3RDLGNBQVUsS0FBSyxRQUFRLE9BQU8sR0FBRyxFQUFFLFdBQVcsS0FBSyxDQUFDO0FBRXBELFFBQUksYUFBYTtBQUdqQixRQUFJLEtBQUssU0FBUyxvQkFBb0IsR0FBRztBQUN2QyxtQkFBYSxtREFBbUQ7QUFBQSxJQUNsRTtBQUdBLGlCQUFhLGtCQUFrQjtBQUcvQixRQUFJLFdBQVcsU0FBUyxZQUFZLEdBQUc7QUFDckMsbUJBQWEsV0FBVyxNQUFNLEdBQUcsV0FBVyxRQUFRLFlBQVksQ0FBQztBQUFBLElBQ25FO0FBR0EsVUFBTSxnQkFBZ0IsV0FBVyxTQUFTLGVBQWU7QUFDekQsVUFBTSxpQkFBaUIsV0FBVyxTQUFTLGlCQUFpQjtBQUM1RCxRQUFJLGVBQWU7QUFDakIsbUJBQWEsV0FBVyxRQUFRLGlCQUFpQixVQUFVO0FBQzNELG1CQUFhLFdBQVcsUUFBUSx5QkFBeUIsRUFBRTtBQUFBLElBQzdELFdBQVcsZ0JBQWdCO0FBQ3pCLG1CQUFhLFdBQVcsUUFBUSxtQkFBbUIsVUFBVTtBQUFBLElBQy9EO0FBR0EsVUFBTSxnQkFBZ0IsV0FBVyxTQUFTLGVBQWU7QUFDekQsVUFBTSxlQUFlLFdBQVcsU0FBUyxjQUFjO0FBQ3ZELFFBQUksY0FBYztBQUNoQixVQUFJLGVBQWU7QUFDakIscUJBQWEsV0FBVyxRQUFRLHNCQUFzQixFQUFFO0FBQUEsTUFDMUQsT0FBTztBQUNMLHFCQUFhLFdBQVcsUUFBUSxnQkFBZ0IsZUFBZTtBQUFBLE1BQ2pFO0FBQUEsSUFDRjtBQUVBLGtCQUFjLFNBQVMsWUFBWSxPQUFPO0FBQUEsRUFDNUM7QUFFQSxRQUFNLE9BQU8sYUFBYTtBQUFBLElBQ3hCLE1BQU0sRUFBRSxNQUFNLE9BQU87QUFBQSxFQUN2QjtBQUVBLFNBQU87QUFDVDs7O0FENWVBLFNBQVMsMEJBQTBCO0FBQ25DLFNBQVMsZ0JBQWdCO0FBSXpCLE9BQU8sYUFBYTtBQUNwQixTQUFTLDBCQUEwQjtBQUNuQyxTQUFTLG1CQUFtQiwyQkFBMkI7QUFKdkQsSUFBTSxpQkFBaUIsTUFBTSxtQkFBbUI7QUFNaEQsSUFBTSxrQkFBa0IsTUFBTSxtQkFBbUI7QUFDakQsSUFBTSxTQUFTLG9CQUFvQjtBQUFBLEVBQ2pDLFlBQVk7QUFBQSxJQUNWLE9BQU87QUFBQSxJQUNQLFNBQVM7QUFBQSxJQUNULFlBQVk7QUFBQSxJQUNaLFlBQVk7QUFBQSxJQUNaLFNBQVM7QUFBQSxJQUNULFdBQVc7QUFBQSxJQUNYLGNBQWM7QUFBQSxJQUNkLGNBQWM7QUFBQSxJQUNkLGNBQWM7QUFBQSxJQUNkLFFBQVE7QUFBQSxJQUNSLFFBQVE7QUFBQSxJQUNSLFFBQVE7QUFBQSxFQUNWO0FBQ0YsQ0FBQztBQUVELElBQU8saUJBQVE7QUFBQSxFQUNiLGFBQWE7QUFBQSxJQUNYLE9BQU87QUFBQSxJQUNQLGFBQWE7QUFBQSxJQUViLFVBQVU7QUFBQSxNQUNSLE9BQU8sSUFBSTtBQUNULFdBQUcsSUFBSSxpQkFBaUI7QUFDeEIsV0FBRyxJQUFJLGtCQUFrQjtBQUN6QixXQUFHLElBQUksUUFBUTtBQUFBLE1BQ2pCO0FBQUEsSUFDRjtBQUFBO0FBQUEsSUFHQSxLQUFLO0FBQUEsTUFDSCxTQUFTO0FBQUE7QUFBQSxRQUVQLCtCQUErQixJQUFJLE9BQU87QUFBQSxNQUM1QztBQUFBLElBQ0Y7QUFBQSxJQUVBLE1BQU07QUFBQSxNQUNKLFNBQVM7QUFBQSxRQUNQLFFBQVE7QUFBQSxRQUNSO0FBQUEsUUFDQSxtQkFBbUI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFFBaUJuQixDQUFDO0FBQUEsTUFDSDtBQUFBLElBQ0Y7QUFBQTtBQUFBLElBR0EsaUJBQWlCO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFNakIsTUFBTTtBQUFBLE1BQ0osQ0FBQyxRQUFRLEVBQUUsS0FBSyxZQUFZLE1BQU0sb0JBQW9CLENBQUM7QUFBQSxNQUN2RCxDQUFDLFFBQVEsRUFBRSxLQUFLLFFBQVEsTUFBTSxnQkFBZ0IsT0FBTyxRQUFRLENBQUM7QUFBQSxNQUM5RCxDQUFDLFFBQVEsRUFBRSxLQUFLLFFBQVEsTUFBTSx5Q0FBeUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUFBLE1BQzlGLENBQUMsUUFBUSxFQUFFLEtBQUssb0JBQW9CLE1BQU0saURBQWlELE1BQU0sWUFBWSxDQUFDO0FBQUEsTUFDOUc7QUFBQSxRQUNFO0FBQUEsUUFDQTtBQUFBLFVBQ0UsTUFBTTtBQUFBLFVBQ04sU0FDRTtBQUFBLFFBQ0o7QUFBQSxNQUNGO0FBQUEsTUFDQTtBQUFBLFFBQ0U7QUFBQSxRQUNBO0FBQUEsVUFDRSxNQUFNO0FBQUEsVUFDTixTQUNFO0FBQUEsUUFDSjtBQUFBLE1BQ0Y7QUFBQSxNQUNBO0FBQUEsUUFDRTtBQUFBLFFBQ0E7QUFBQSxVQUNFLE1BQU07QUFBQSxVQUNOLFNBQVM7QUFBQSxRQUNYO0FBQUEsTUFDRjtBQUFBLE1BQ0E7QUFBQSxRQUNFO0FBQUEsUUFDQTtBQUFBLFVBQ0UsVUFBVTtBQUFBLFVBQ1YsU0FDRTtBQUFBLFFBQ0o7QUFBQSxNQUNGO0FBQUEsTUFFQSxDQUFDLFFBQVEsRUFBRSxVQUFVLFlBQVksU0FBUyxZQUFZLENBQUM7QUFBQSxNQUN2RCxDQUFDLFFBQVEsRUFBRSxVQUFVLGdCQUFnQixTQUFTLGdCQUFnQixDQUFDO0FBQUEsTUFDL0QsQ0FBQyxRQUFRLEVBQUUsVUFBVSxXQUFXLFNBQVMsVUFBVSxDQUFDO0FBQUEsTUFDcEQ7QUFBQSxRQUNFO0FBQUEsUUFDQTtBQUFBLFVBQ0UsVUFBVTtBQUFBLFVBQ1YsU0FDRTtBQUFBLFFBQ0o7QUFBQSxNQUNGO0FBQUEsTUFDQSxDQUFDLFFBQVEsRUFBRSxVQUFVLFVBQVUsU0FBUyx3QkFBd0IsQ0FBQztBQUFBLE1BQ2pFLENBQUMsUUFBUSxFQUFFLFVBQVUsWUFBWSxTQUFTLHNDQUFzQyxDQUFDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBZW5GO0FBQUE7QUFBQSxJQUdBLFdBQVc7QUFBQSxJQUNYLE1BQU0sUUFBUSxJQUFJLFFBQVE7QUFBQTtBQUFBO0FBQUEsSUFLMUIsU0FBUztBQUFBLE1BQ1AsVUFBVSxRQUFRLElBQUksWUFBWTtBQUFBLElBQ3BDO0FBQUEsSUFFQSxhQUFhO0FBQUEsTUFDWCxXQUFXO0FBQUEsTUFDWCxNQUFNO0FBQUEsUUFDSixNQUFNO0FBQUEsUUFDTixPQUFPO0FBQUEsUUFDUCxLQUFLO0FBQUEsTUFDUDtBQUFBO0FBQUEsTUFHQSxLQUFLO0FBQUEsUUFDSCxFQUFFLE1BQU0sVUFBVSxNQUFNLFVBQVU7QUFBQSxRQUNsQyxFQUFFLE1BQU0sWUFBWSxNQUFNLE9BQU87QUFBQSxRQUNqQyxFQUFFLE1BQU0sZ0JBQWdCLE1BQU0sNENBQTRDO0FBQUEsTUFDNUU7QUFBQSxNQUVBLFNBQVM7QUFBQSxRQUNQLEdBQUcsZ0JBQWdCO0FBQUEsUUFDbkI7QUFBQSxVQUNFLE1BQU07QUFBQSxVQUNOLFdBQVc7QUFBQTtBQUFBLFVBRVgsT0FBTztBQUFBLFlBQ0wsRUFBRSxNQUFNLFlBQVk7QUFBQSxZQUNwQixHQUFHLGVBQWUsYUFBYTtBQUFBLFlBQy9CLEVBQUUsTUFBTSxhQUFhO0FBQUEsWUFDckIsR0FBRyxlQUFlLGtCQUFrQjtBQUFBLFVBQ3RDO0FBQUEsUUFDRjtBQUFBLFFBQ0E7QUFBQSxVQUNFLE1BQU07QUFBQSxVQUNOLFdBQVc7QUFBQTtBQUFBLFVBRVgsT0FBTyxlQUFlO0FBQUEsUUFDeEI7QUFBQSxNQUNGO0FBQUEsTUFFQSxhQUFhO0FBQUEsUUFDWCxFQUFFLE1BQU0sVUFBVSxNQUFNLGdEQUFnRDtBQUFBLFFBQ3hFLEVBQUUsTUFBTSxXQUFXLE1BQU0sZ0NBQWdDO0FBQUEsUUFDekQsRUFBRSxNQUFNLFdBQVcsTUFBTSx5Q0FBeUM7QUFBQSxNQUNwRTtBQUFBLE1BRUEsVUFBVTtBQUFBLFFBQ1IsU0FBUztBQUFBLE1BQ1g7QUFBQSxNQUVBLFFBQVE7QUFBQSxRQUNOLFVBQVU7QUFBQSxNQUNaO0FBQUEsTUFFQSxTQUFTO0FBQUEsUUFDUCxPQUFPO0FBQUEsTUFDVDtBQUFBLE1BRUEsUUFBUTtBQUFBLFFBQ04sU0FBUztBQUFBLFFBQ1QsV0FBVztBQUFBLE1BQ2I7QUFBQSxJQUNGO0FBQUEsRUFDRixDQUFDO0FBQ0g7IiwKICAibmFtZXMiOiBbImtleSJdCn0K
