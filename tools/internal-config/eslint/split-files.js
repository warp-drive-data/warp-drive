const TEMPLATE_TAG_EXTS = new Set(['gts', 'gjs']);

/**
 * Splits a list of glob patterns ending in a `*.{ext,ext,...}` extension group into two lists:
 * one with `.gts`/`.gjs` extensions removed (`plain`), one with only `.gts`/`.gjs` (`templateTag`).
 * Patterns without a recognizable extension group (e.g. bare filenames like `eslint.config.mjs`)
 * are left untouched and returned in `plain`, since oxlint's parser can't scan `.gts`/`.gjs`
 * regardless of pattern shape.
 *
 * @param {string[]} files
 * @return {{ plain: string[], templateTag: string[] }}
 */
export function splitByExtension(files) {
  const plain = [];
  const templateTag = [];

  for (const pattern of files) {
    const match = pattern.match(/^(.*\*\.)\{([^}]+)\}$/);
    if (!match) {
      plain.push(pattern);
      continue;
    }

    const [, prefix, extGroup] = match;
    const exts = extGroup.split(',');
    const plainExts = exts.filter((ext) => !TEMPLATE_TAG_EXTS.has(ext));
    const templateTagExts = exts.filter((ext) => TEMPLATE_TAG_EXTS.has(ext));

    if (plainExts.length) {
      plain.push(plainExts.length === 1 ? `${prefix}${plainExts[0]}` : `${prefix}{${plainExts.join(',')}}`);
    }
    if (templateTagExts.length) {
      templateTag.push(
        templateTagExts.length === 1 ? `${prefix}${templateTagExts[0]}` : `${prefix}{${templateTagExts.join(',')}}`
      );
    }
  }

  return { plain, templateTag };
}
