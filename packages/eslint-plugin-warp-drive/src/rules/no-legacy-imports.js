/**
 * {@include ./no-legacy-imports.md}
 * @module
 */
'use strict';

const { listFromVersions, loadMap } = require('../legacy-import-mapping/index.js');

const RULE_ID = 'warp-drive.no-legacy-imports';
const UNMAPPED_EXPORT_ID = 'warp-drive.no-legacy-imports.unmapped-export';
const LEGACY_HOME_ID = 'warp-drive.no-legacy-imports.legacy-home';

/**
 * @typedef {import('../legacy-import-mapping').Token} Token
 * @typedef {{ kind: 'rewrite', to: Token }
 *        | { kind: 'unchanged' }
 *        | { kind: 'removed' }
 *        | { kind: 'legacy-home', to: Token }
 *        | { kind: 'unknown' }
 *        | { kind: 'foreign' }} Outcome
 */

/**
 * @param {import('../legacy-import-mapping').ExportMap} map
 * @param {string} moduleName
 * @param {string} exportName   'default' for a default import
 * @returns {Outcome}
 */
function outcomeFor(map, moduleName, exportName) {
  const relocation = map.lookup(moduleName, exportName);
  if (relocation) {
    switch (relocation.outcome) {
      case 'removed':
        return { kind: 'removed' };
      case 'legacy':
        return { kind: 'legacy-home', to: relocation.to };
      case 'unchanged':
        return { kind: 'unchanged' };
      case 'moved':
        return { kind: 'rewrite', to: relocation.to };
    }
  }
  const move = map.moduleMove(moduleName);
  if (move) return { kind: 'rewrite', to: { module: move.module, export: exportName, typeOnly: false } };
  return { kind: map.knows(moduleName) ? 'unknown' : 'foreign' };
}

/**
 * @param {import('eslint').Rule.RuleContext} context
 * @param {import('../legacy-import-mapping').ExportMap} map
 */
function createHelpers(context, map) {
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
   * @typedef {{ spec: any, originalExportName: string | null, targetExportName: string | null, isType: boolean, report: typeof UNMAPPED_EXPORT_ID | typeof LEGACY_HOME_ID | null }} SpecifierDescriptor
   */

  /** @returns {Record<string, SpecifierDescriptor[]>} */
  function groupImportSpecifiersByTarget(moduleName, specifiers, declarationIsTypeOnly) {
    const groups = Object.create(null);
    const move = map.moduleMove(moduleName);
    for (const spec of specifiers) {
      const expName = getImportExportNameFromImportSpecifier(spec);
      const isType = declarationIsTypeOnly || spec.importKind === 'type';
      if (!expName) {
        const targetModule = move ? move.module : moduleName;
        groups[targetModule] ||= [];
        groups[targetModule].push({ spec, originalExportName: null, targetExportName: null, isType, report: null });
        continue;
      }

      const outcome = outcomeFor(map, moduleName, expName);
      const rewrite = outcome.kind === 'rewrite';
      const targetModule = rewrite ? outcome.to.module : moduleName;
      const targetExportName = rewrite ? outcome.to.export : expName;
      const report =
        outcome.kind === 'removed' || outcome.kind === 'unknown'
          ? UNMAPPED_EXPORT_ID
          : outcome.kind === 'legacy-home'
            ? LEGACY_HOME_ID
            : null;

      groups[targetModule] ||= [];
      groups[targetModule].push({ spec, originalExportName: expName, targetExportName, isType, report });
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

  /** @param {typeof UNMAPPED_EXPORT_ID | typeof LEGACY_HOME_ID} messageId */
  function collectReportedExportNames(groups, messageId) {
    const names = [];
    for (const mod of Object.keys(groups)) {
      for (const d of groups[mod]) {
        if (d.report === messageId) names.push(d.originalExportName);
      }
    }
    return names;
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
    collectReportedExportNames,
    buildImportTextForGroup,
  };
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          from: { enum: listFromVersions() },
        },
        additionalProperties: false,
      },
    ],
    docs: {
      description: 'Rewrites legacy WarpDrive import module specifiers to their modern replacements.',
      recommended: false,
      url: 'https://github.com/warp-drive-data/warp-drive/tree/main/packages/eslint-plugin-warp-drive/src/rules/no-legacy-imports.md',
    },
    messages: {
      [RULE_ID]: 'Rewrite import from "{{from}}" to modern modules.',
      [UNMAPPED_EXPORT_ID]:
        'Import{{plural}} "{{tokens}}" from "{{from}}" {{verb}} no replacement in {{to}}. ' +
        'This import was left as-is and needs manual migration.',
      [LEGACY_HOME_ID]:
        'Import{{plural}} "{{tokens}}" from "{{from}}" still live{{s}} in a legacy package in {{to}}. ' +
        'There is no modern module to rewrite to yet.',
    },
  },

  create(context) {
    const map = loadMap(context.options[0] && context.options[0].from);
    const helpers = createHelpers(context, map);

    function handleImportDeclaration(node) {
      if (!node.source || !node.source.value || !node.specifiers || node.specifiers.length === 0) return;
      const fromModule = String(node.source.value);
      const declarationIsTypeOnly = node.importKind === 'type';

      const groups = helpers.groupImportSpecifiersByTarget(fromModule, node.specifiers, declarationIsTypeOnly);
      const hasMapped = helpers.hasAnyMappedTarget(groups, fromModule);
      const unresolvedNames = helpers.collectReportedExportNames(groups, UNMAPPED_EXPORT_ID);
      const legacyNames = helpers.collectReportedExportNames(groups, LEGACY_HOME_ID);

      if (!hasMapped && !unresolvedNames.length && !legacyNames.length) return;

      const quote = helpers.getQuoteChar(node);

      if (hasMapped) {
        const groupKeys = Object.keys(groups);
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

      if (unresolvedNames.length) {
        context.report({
          node,
          messageId: UNMAPPED_EXPORT_ID,
          data: {
            from: fromModule,
            to: map.to,
            tokens: unresolvedNames.join(', '),
            plural: unresolvedNames.length > 1 ? 's' : '',
            verb: unresolvedNames.length > 1 ? 'have' : 'has',
          },
        });
      }

      if (legacyNames.length) {
        context.report({
          node,
          messageId: LEGACY_HOME_ID,
          data: {
            from: fromModule,
            to: map.to,
            tokens: legacyNames.join(', '),
            plural: legacyNames.length > 1 ? 's' : '',
            s: legacyNames.length > 1 ? '' : 's',
          },
        });
      }
    }

    return {
      ImportDeclaration: handleImportDeclaration,
    };
  },
};
