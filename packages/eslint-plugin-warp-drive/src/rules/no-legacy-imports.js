/**
 * {@include ./no-legacy-imports.md}
 * @module
 */
'use strict';

const path = require('path');

const RULE_ID = 'warp-drive.no-legacy-imports';

// TODO: determine where this thing should live long-term
function buildMapping() {
  // Attempt to load the enriched mapping JSON from the repo root.
  // In this monorepo, this file lives at: <repoRoot>/public-exports-mapping-5.5.enriched.json
  const candidates = [
    // from this file at packages/eslint-plugin-warp-drive/src/rules/, walk up to repo root
    path.join(__dirname, '../public-exports-mapping-5.5.enriched.json'),
    // from package root (if tests change CWD)
    path.join(process.cwd(), 'public-exports-mapping-5.5.enriched.json'),
  ];

  let mappingArray = null;
  for (const candidate of candidates) {
    try {
      mappingArray = require(candidate);
      break;
    } catch (_e) {
      // continue
    }
  }

  /**
   * Map key: `${module}::${exportName}` where exportName can be 'default'.
   * Map value: `{ module, export }` describing the replacement module and the
   * (possibly renamed, possibly default<->named) export to use from it.
   */
  const lookup = new Map();

  if (Array.isArray(mappingArray)) {
    for (const entry of mappingArray) {
      // Only consider non-type exports and entries that have a clear replacement
      if (!entry || entry.typeOnly) continue;
      const srcMod = entry.module;
      const exp = entry.export;
      const replModule = entry.replacement && entry.replacement.module;
      const replExport = entry.replacement && entry.replacement.export;
      if (!srcMod || !exp || !replModule || !replExport) continue;
      lookup.set(`${srcMod}::${exp}`, { module: replModule, export: replExport });
    }
  }

  return lookup;
}

const MAPPING = buildMapping();

/** @param {import('eslint').Rule.RuleContext} context */
function createHelpers(context) {
  const sourceCode = context.sourceCode || context.getSourceCode();

  function getQuoteChar(node) {
    const raw = sourceCode.getText(node.source);
    return raw.startsWith('"') ? '"' : "'";
  }

  function getImportExportNameFromImportSpecifier(spec) {
    // default import
    if (spec.type === 'ImportDefaultSpecifier') return 'default';
    if (spec.type === 'ImportSpecifier') return spec.imported && spec.imported.name;
    // namespace import – not supported in v1
    return null;
  }

  /**
   * @typedef {{ spec: any, originalExportName: string | null, targetExportName: string | null, isType: boolean }} SpecifierDescriptor
   */

  /** @returns {Record<string, SpecifierDescriptor[]>} */
  function groupImportSpecifiersByTarget(moduleName, specifiers, declarationIsTypeOnly) {
    const groups = Object.create(null);
    for (const spec of specifiers) {
      const expName = getImportExportNameFromImportSpecifier(spec);
      // A specifier is type-only if the whole declaration is `import type ...`
      // or if it carries its own inline `type` modifier (e.g. `{ type Foo }`).
      const isType = declarationIsTypeOnly || spec.importKind === 'type';
      if (!expName) {
        // namespace or unknown – keep under original module, verbatim
        groups[moduleName] ||= [];
        groups[moduleName].push({ spec, originalExportName: null, targetExportName: null, isType });
        continue;
      }
      const target = MAPPING.get(`${moduleName}::${expName}`);
      const targetModule = target ? target.module : moduleName; // unknowns remain under original module
      const targetExportName = target ? target.export : expName; // unknowns keep their own export name
      groups[targetModule] ||= [];
      groups[targetModule].push({ spec, originalExportName: expName, targetExportName, isType });
    }
    return groups;
  }

  function hasAnyMappedTarget(groups, originalModule) {
    return Object.keys(groups).some((mod) => {
      if (mod !== originalModule) return true;
      // Module didn't change, but the export itself may still have been renamed
      // (e.g. default -> a named export, or a named export -> a different name).
      return groups[mod].some((d) => d.originalExportName && d.targetExportName !== d.originalExportName);
    });
  }

  function buildSpecifierText(descriptor) {
    if (descriptor.targetExportName == null) {
      // namespace or unrecognized specifier – keep it exactly as written
      return { kind: 'verbatim', text: sourceCode.getText(descriptor.spec), isType: descriptor.isType };
    }
    const localName = descriptor.spec.local.name;
    if (descriptor.targetExportName === 'default') {
      return { kind: 'default', text: localName, isType: descriptor.isType };
    }
    const text =
      descriptor.targetExportName === localName
        ? descriptor.targetExportName
        : `${descriptor.targetExportName} as ${localName}`;
    return { kind: 'named', text, isType: descriptor.isType };
  }

  function buildImportTextForGroup(groupModule, descriptors, quote) {
    const rendered = descriptors.map(buildSpecifierText);
    // If every specifier landing in this group is type-only, hoist the `type`
    // modifier onto the declaration itself instead of repeating it per-specifier.
    const wholeImportIsType = rendered.length > 0 && rendered.every((r) => r.isType);

    const defaults = rendered.filter((r) => r.kind === 'default').map((r) => r.text);
    const verbatim = rendered.filter((r) => r.kind === 'verbatim').map((r) => r.text);
    const named = rendered
      .filter((r) => r.kind === 'named')
      .map((r) => (r.isType && !wholeImportIsType ? `type ${r.text}` : r.text));

    const segments = [];
    if (defaults.length) segments.push(defaults.join(', '));
    if (verbatim.length) segments.push(verbatim.join(', '));
    if (named.length) segments.push(`{ ${named.join(', ')} }`);
    if (!segments.length) {
      // Should not happen, but avoid generating invalid code
      return '';
    }

    const importKeyword = wholeImportIsType ? 'import type ' : 'import ';
    return [importKeyword, segments.join(', '), ' from ', quote, groupModule, quote, ';'].join('');
  }

  return {
    getQuoteChar,
    groupImportSpecifiersByTarget,
    hasAnyMappedTarget,
    buildImportTextForGroup,
  };
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    schema: false,
    docs: {
      description:
        'Rewrites legacy WarpDrive import module specifiers to their modern replacements using an embedded mapping.',
      recommended: false,
      url: 'https://github.com/warp-drive-data/warp-drive/tree/main/packages/eslint-plugin-warp-drive/docs/no-legacy-imports.md',
    },
    messages: {
      [RULE_ID]: 'Rewrite import from "{{from}}" to modern modules.',
    },
  },

  create(context) {
    const helpers = createHelpers(context);

    function handleImportDeclaration(node) {
      if (!node.source || !node.source.value || !node.specifiers || node.specifiers.length === 0) return;
      const fromModule = String(node.source.value);
      const declarationIsTypeOnly = node.importKind === 'type';

      const groups = helpers.groupImportSpecifiersByTarget(fromModule, node.specifiers, declarationIsTypeOnly);
      const hasMapped = helpers.hasAnyMappedTarget(groups, fromModule);
      if (!hasMapped) return;

      const groupKeys = Object.keys(groups);
      const quote = helpers.getQuoteChar(node);

      // Rebuild every group's specifier text from scratch (rather than only swapping the
      // module string) since a replacement export may differ in name and/or default-vs-named
      // kind from the original specifier.
      context.report({
        node,
        messageId: RULE_ID,
        data: { kind: 'import', from: fromModule },
        fix(fixer) {
          const pieces = [];
          for (const mod of groupKeys) {
            const text = helpers.buildImportTextForGroup(mod, groups[mod], quote);
            if (text) pieces.push(text);
          }
          const replacement = pieces.join('\n');
          return fixer.replaceText(node, replacement);
        },
      });
    }

    return {
      ImportDeclaration: handleImportDeclaration,
    };
  },
};
