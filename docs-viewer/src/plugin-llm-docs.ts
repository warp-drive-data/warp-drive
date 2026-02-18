/**
 * VitePress plugin that generates LLM-specific documentation files,
 * categorizing code patterns as `recommended`, `deprecated`, or `discouraged`.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * USAGE
 * ──────────────────────────────────────────────────────────────────────────
 * Add the plugin to your `.vitepress/config.mts`:
 *
 * ```ts
 * import { warpDriveLLMDocs } from '../../src/plugin-llm-docs.ts';
 *
 * export default defineConfig({
 *   vite: {
 *     plugins: [warpDriveLLMDocs()]
 *   }
 * });
 * ```
 *
 * ──────────────────────────────────────────────────────────────────────────
 * FRONTMATTER SCHEMA
 * ──────────────────────────────────────────────────────────────────────────
 * Classify any page by adding an `llm` block to its YAML frontmatter:
 *
 * ```yaml
 * ---
 * llm:
 *   # Required: classification of the pattern described on this page.
 *   status: recommended        # | deprecated | discouraged
 *
 *   # Optional: brief description shown in every LLM context file.
 *   # Falls back to the page `description` field when omitted.
 *   context: "Use SchemaService to define resource shapes."
 *
 *   # Optional: path or URL to the preferred alternative.
 *   # Relevant for deprecated and discouraged pages.
 *   prefer: "/guides/the-manual/schemas/resources/polaris-mode"
 *
 *   # Optional: version when this pattern was deprecated.
 *   # Relevant for deprecated pages only.
 *   since: "v5.0"
 *
 *   # Optional: set to true to exclude this page from all LLM files
 *   # even if a status is set. Useful for index/overview pages that
 *   # happen to mention a pattern without being a canonical reference.
 *   exclude: false
 * ---
 * ```
 *
 * ──────────────────────────────────────────────────────────────────────────
 * OUTPUT FILES  (written to the VitePress outDir)
 * ──────────────────────────────────────────────────────────────────────────
 *  llms-recommended.txt   — current best practices
 *  llms-deprecated.txt    — patterns that must not be used in new code
 *  llms-discouraged.txt   — patterns to avoid when better options exist
 *  llms-code-patterns.txt — combined file with all three sections
 */

import type { Plugin, ResolvedConfig } from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';
import { globSync } from 'node:fs';
import fm from 'front-matter';

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type LLMStatus = 'recommended' | 'deprecated' | 'discouraged';

/**
 * The `llm` section of a page's YAML frontmatter.
 */
export interface LLMFrontmatter {
  /** Classification of the pattern covered by this page. */
  status?: LLMStatus;

  /**
   * Brief description for LLM context files.
   * Falls back to the page `description` frontmatter field.
   */
  context?: string;

  /**
   * Path or URL to the preferred alternative.
   * Shown in `deprecated` and `discouraged` entries.
   */
  prefer?: string;

  /**
   * The version in which this pattern was deprecated.
   * Shown in `deprecated` entries.
   */
  since?: string;

  /**
   * When `true`, this page is excluded from all generated LLM files
   * even if a `status` is present.
   */
  exclude?: boolean;
}

export interface LLMDocsOptions {
  /**
   * Directory to scan for markdown files.
   * Defaults to the VitePress `srcDir` (usually `docs.warp-drive.io/`).
   */
  srcDir?: string;

  /**
   * Override the introductory paragraph written at the top of each file.
   * Use the `{title}` placeholder to insert the site title.
   */
  preambles?: {
    recommended?: string;
    deprecated?: string;
    discouraged?: string;
    combined?: string;
  };

  /**
   * Output file names, relative to the VitePress `outDir`.
   * Defaults are shown below.
   *
   * @default
   * {
   *   recommended: 'llms-recommended.txt',
   *   deprecated:  'llms-deprecated.txt',
   *   discouraged: 'llms-discouraged.txt',
   *   combined:    'llms-code-patterns.txt',
   * }
   */
  output?: {
    recommended?: string;
    deprecated?: string;
    discouraged?: string;
    combined?: string;
  };

  /**
   * Whether to generate the combined `llms-code-patterns.txt` file.
   * @default true
   */
  combined?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal types
// ─────────────────────────────────────────────────────────────────────────────

interface PageFrontmatter {
  llm?: LLMFrontmatter;
  title?: string;
  description?: string;
  draft?: boolean;
  [key: string]: unknown;
}

interface PageEntry {
  relativePath: string;
  title: string;
  description: string;
  llm: Required<LLMFrontmatter>;
  content: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Markdown cleaning
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Strip VitePress-specific markup so that the generated text files are clean,
 * readable markdown that LLMs can consume without any framework knowledge.
 *
 * Transformations applied:
 *   • VitePress admonition containers  → blockquote with label
 *   • `::: code-group` / `:::tabs`     → stripped, tab headings kept as bold text
 *   • Self-closing Vue components      → removed
 *   • Block Vue components             → removed (text content lost — these are UI chrome)
 *   • HTML media elements              → removed
 *   • Consecutive blank lines          → collapsed to one blank line
 */
function cleanMarkdownForLLM(content: string): string {
  return (
    content
      // VitePress admonition containers (::: tip / warning / danger / info / details)
      .replace(
        /^:::\s*(tip|info|warning|danger|details)\s*([^\n]*)\n([\s\S]*?)^:::\s*$/gm,
        (_match, type: string, rawTitle: string, body: string) => {
          const title = rawTitle.trim();
          const label = title
            ? `**[${type.toUpperCase()}: ${title}]**`
            : `**[${type.toUpperCase()}]**`;
          const quotedBody = body
            .trim()
            .split('\n')
            .map((line) => `> ${line}`)
            .join('\n');
          return `${label}\n${quotedBody}`;
        },
      )
      // ::: code-group — strip the marker, content is preserved verbatim
      .replace(/^::: code-group\s*$/gm, '')
      // :::tabs — strip the marker, convert tab names to bold headings
      .replace(/^:::tabs\s*$/gm, '')
      .replace(/^== (.+)\s*$/gm, '**$1:**')
      // Any remaining ::: markers (closing tags)
      .replace(/^:::\s*$/gm, '')
      // Block Vue/HTML components: <ComponentName ...>...</ComponentName>
      .replace(/<([A-Z][a-zA-Z0-9]*)(?:\s[^>]*)?>[\s\S]*?<\/\1>/g, '')
      // Self-closing Vue/HTML components: <ComponentName ... />
      .replace(/<[A-Z][a-zA-Z0-9]*(?:\s[^>]*)?\s*\/>/g, '')
      // HTML media elements (images are meaningless in text)
      .replace(/<\/?(img|video|audio|iframe)[^>]*\/?>/gi, '')
      // Collapse runs of 3+ blank lines to a single blank line
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page collection
// ─────────────────────────────────────────────────────────────────────────────

function deriveTitle(relativePath: string): string {
  const basename = path.basename(relativePath, '.md');
  if (basename === 'index') {
    const parent = path.basename(path.dirname(relativePath));
    return parent === '.' ? 'Introduction' : toTitleCase(parent);
  }
  return toTitleCase(basename);
}

function toTitleCase(str: string): string {
  return str
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function collectLLMPages(srcDir: string): Promise<PageEntry[]> {
  const files = (globSync('**/*.md', { cwd: srcDir }) as string[]).filter(
    (f) => !f.startsWith('node_modules') && !f.startsWith('.vitepress'),
  );

  const pages: PageEntry[] = [];

  for (const relativePath of files) {
    const filePath = path.join(srcDir, relativePath);
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = fm<PageFrontmatter>(raw);
    const attrs = parsed.attributes;

    // Skip draft pages and pages not tagged for LLM documentation
    if (attrs.draft || !attrs.llm) continue;

    const llm = attrs.llm;

    // Pages must have a status; exclusions and unclassified pages are skipped
    if (!llm.status || llm.exclude) continue;

    pages.push({
      relativePath,
      title: attrs.title ?? deriveTitle(relativePath),
      description: llm.context ?? attrs.description ?? '',
      llm: {
        status: llm.status,
        context: llm.context ?? attrs.description ?? '',
        prefer: llm.prefer ?? '',
        since: llm.since ?? '',
        exclude: false,
      },
      content: cleanMarkdownForLLM(parsed.body),
    });
  }

  return pages;
}

// ─────────────────────────────────────────────────────────────────────────────
// Content generation
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<LLMStatus, string> = {
  recommended: 'Recommended Patterns',
  deprecated: 'Deprecated Patterns',
  discouraged: 'Discouraged Patterns',
};

const DEFAULT_PREAMBLES = {
  recommended: `These are the **recommended** patterns for {title}. When helping users write new \
code, prefer these approaches over deprecated or discouraged alternatives.`,

  deprecated: `These patterns are **deprecated** and MUST NOT be suggested for new code. \
If you encounter them in an existing codebase, recommend migrating to the listed alternatives. \
Continuing to use deprecated patterns leads to increased maintenance burden and will break on \
future major versions.`,

  discouraged: `These patterns are **discouraged** — they work but carry significant trade-offs \
such as performance penalties, larger bundle sizes, or reduced type safety. Prefer the recommended \
alternatives when helping users write new code. Mention the trade-offs when a user explicitly \
asks about these patterns.`,

  combined: `This file documents {title} code patterns grouped by support status. \
Use this as context when assisting with {title} development so you can suggest the right \
patterns and steer users away from deprecated or discouraged ones.`,
} as const satisfies Required<NonNullable<LLMDocsOptions['preambles']>>;

const DEFAULT_OUTPUT = {
  recommended: 'llms-recommended.txt',
  deprecated: 'llms-deprecated.txt',
  discouraged: 'llms-discouraged.txt',
  combined: 'llms-code-patterns.txt',
} as const satisfies Required<NonNullable<LLMDocsOptions['output']>>;

function interpolate(template: string, siteTitle: string): string {
  return template.replace(/\{title\}/g, siteTitle);
}

function formatEntry(entry: PageEntry): string {
  const lines: string[] = [];

  lines.push(`## ${entry.title}`);
  lines.push(`> File: \`${entry.relativePath}\``);

  if (entry.description) {
    lines.push(`> ${entry.description}`);
  }
  if (entry.llm.since) {
    lines.push(`> Deprecated since: ${entry.llm.since}`);
  }
  if (entry.llm.prefer) {
    lines.push(`> Prefer instead: ${entry.llm.prefer}`);
  }

  lines.push('');
  lines.push(entry.content);
  lines.push('');
  lines.push('---');
  lines.push('');

  return lines.join('\n');
}

function buildCategoryFile(
  status: LLMStatus,
  pages: PageEntry[],
  preamble: string,
  siteTitle: string,
): string {
  const matching = pages.filter((p) => p.llm.status === status);
  if (matching.length === 0) return '';

  return [
    `# ${siteTitle} — ${STATUS_LABELS[status]}`,
    '',
    interpolate(preamble, siteTitle),
    '',
    '---',
    '',
    ...matching.map(formatEntry),
  ].join('\n');
}

function buildCombinedFile(
  pages: PageEntry[],
  preamble: string,
  siteTitle: string,
): string {
  if (pages.length === 0) return '';

  /**
   * Section order: recommended first so the "do this" context is established
   * before the LLM encounters the "don't do this" sections.
   */
  const SECTIONS: { status: LLMStatus; note: string }[] = [
    {
      status: 'recommended',
      note: 'Use these patterns for new code.',
    },
    {
      status: 'discouraged',
      note: 'Avoid these patterns in new code — prefer the recommended alternatives.',
    },
    {
      status: 'deprecated',
      note: 'Do NOT use these patterns. Recommend migrating existing code to the listed alternatives.',
    },
  ];

  const byStatus = Object.fromEntries(
    (['recommended', 'deprecated', 'discouraged'] as LLMStatus[]).map(
      (s) => [s, pages.filter((p) => p.llm.status === s)],
    ),
  ) as Record<LLMStatus, PageEntry[]>;

  const lines: string[] = [
    `# ${siteTitle} — Code Patterns Reference`,
    '',
    interpolate(preamble, siteTitle),
    '',
    '---',
    '',
  ];

  for (const { status, note } of SECTIONS) {
    const entries = byStatus[status];
    if (entries.length === 0) continue;

    lines.push(`# ${STATUS_LABELS[status]}`);
    lines.push('');
    lines.push(`> ${note}`);
    lines.push('');

    for (const entry of entries) {
      lines.push(formatEntry(entry));
    }
  }

  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Plugin
// ─────────────────────────────────────────────────────────────────────────────

/**
 * VitePress plugin that generates LLM-specific documentation files.
 *
 * @example
 * ```ts
 * // .vitepress/config.mts
 * import { warpDriveLLMDocs } from '../../src/plugin-llm-docs.ts';
 *
 * export default defineConfig({
 *   vite: { plugins: [warpDriveLLMDocs()] }
 * });
 * ```
 */
export function warpDriveLLMDocs(options: LLMDocsOptions = {}): Plugin {
  let resolvedConfig!: ResolvedConfig;
  let srcDir = '';
  let outDir = '';
  let siteTitle = 'WarpDrive';

  return {
    name: 'warp-drive-llm-docs',
    enforce: 'post',

    configResolved(config) {
      resolvedConfig = config;

      // VitePress attaches its own config object to the Vite config under
      // the `vitepress` key. Fall back to standard Vite values when not found.
      const vp = (config as unknown as { vitepress?: { srcDir: string; outDir: string; title?: string } })
        .vitepress;

      srcDir = options.srcDir ?? vp?.srcDir ?? config.root;
      outDir = vp?.outDir ?? config.build.outDir;
      siteTitle = vp?.title ?? 'WarpDrive';
    },

    async closeBundle() {
      // VitePress runs both a client build and an SSR build. We only want to
      // generate the text files once, so we skip the SSR pass.
      if (resolvedConfig.build.ssr) return;

      let pages: PageEntry[];
      try {
        pages = await collectLLMPages(srcDir);
      } catch (err) {
        this.warn(`[warp-drive-llm-docs] Failed to collect pages: ${String(err)}`);
        return;
      }

      if (pages.length === 0) return;

      const preambles = { ...DEFAULT_PREAMBLES, ...options.preambles };
      const output = { ...DEFAULT_OUTPUT, ...options.output };
      const includeCombined = options.combined !== false;

      const writes: Promise<void>[] = [];

      for (const status of ['recommended', 'deprecated', 'discouraged'] as LLMStatus[]) {
        const content = buildCategoryFile(status, pages, preambles[status], siteTitle);
        if (!content) continue;
        writes.push(fs.writeFile(path.join(outDir, output[status]), content, 'utf-8'));
      }

      if (includeCombined) {
        const combined = buildCombinedFile(pages, preambles.combined, siteTitle);
        if (combined) {
          writes.push(fs.writeFile(path.join(outDir, output.combined), combined, 'utf-8'));
        }
      }

      await Promise.all(writes);

      // Summary log
      const statusCounts = (['recommended', 'deprecated', 'discouraged'] as LLMStatus[]).map(
        (s) => `${s}: ${pages.filter((p) => p.llm.status === s).length}`,
      );
      console.log(`  ${'\x1b[34m'}llm-docs${'\x1b[0m'} generated — ${statusCounts.join(', ')}`);
    },
  };
}

export default warpDriveLLMDocs;
