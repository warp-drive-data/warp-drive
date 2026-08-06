/**
 * {@include ./no-legacy-imports.md}
 * @module
 */
'use strict';

const path = require('path');

const RULE_ID = 'warp-drive.no-legacy-imports';
const UNMAPPED_EXPORT_ID = 'warp-drive.no-legacy-imports.unmapped-export';

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
  // All legacy module specifiers we have any bookkeeping for at all, whether or not
  // every export of theirs has a known replacement yet.
  const knownModules = new Set();
  // module -> Set<replacement module>, used to derive a fallback below.
  const moduleTargets = new Map();

  if (Array.isArray(mappingArray)) {
    for (const entry of mappingArray) {
      if (!entry || !entry.module || !entry.export) continue;
      knownModules.add(entry.module);

      const replModule = entry.replacement && entry.replacement.module;
      const replExport = entry.replacement && entry.replacement.export;
      if (!replModule || !replExport) continue;

      lookup.set(`${entry.module}::${entry.export}`, { module: replModule, export: replExport });

      let targets = moduleTargets.get(entry.module);
      if (!targets) {
        targets = new Set();
        moduleTargets.set(entry.module, targets);
      }
      targets.add(replModule);
    }
  }

  // A module-level fallback: only safe when every export we know about for a given
  // legacy module funnels into the exact same replacement module. This lets us route
  // exports added since the mapping was last generated (e.g. new types exposed via
  // `export *`) without having to enumerate every token by name. Modules that
  // legitimately split across multiple replacement modules (e.g. some tokens go to
  // `@warp-drive/core`, others to `@warp-drive/ember`) are left out on purpose —
  // guessing wrong there would silently produce an incorrect rewrite.
  const moduleFallback = new Map();
  for (const [mod, targets] of moduleTargets) {
    if (targets.size === 1) {
      moduleFallback.set(mod, [...targets][0]);
    }
  }

  return { lookup, moduleFallback, knownModules };
}

const { lookup: MAPPING, moduleFallback: MODULE_FALLBACK, knownModules: KNOWN_MODULES } = buildMapping();

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
   * @typedef {{ spec: any, originalExportName: string | null, targetExportName: string | null, isType: boolean, unresolved: boolean }} SpecifierDescriptor
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
        groups[moduleName].push({ spec, originalExportName: null, targetExportName: null, isType, unresolved: false });
        continue;
      }

      const target = MAPPING.get(`${moduleName}::${expName}`);
      let targetModule = moduleName;
      let targetExportName = expName;
      let unresolved = false;

      if (target) {
        targetModule = target.module;
        targetExportName = target.export;
      } else {
        const fallbackModule = MODULE_FALLBACK.get(moduleName);
        if (fallbackModule) {
          // Not individually tracked, but this legacy module's known exports all funnel
          // into a single replacement module, so route this one the same way.
          targetModule = fallbackModule;
        } else if (KNOWN_MODULES.has(moduleName)) {
          // We actively track this legacy module but have no idea where this particular
          // export goes (added after the mapping was generated, or genuinely ambiguous).
          unresolved = true;
        }
      }

      groups[targetModule] ||= [];
      groups[targetModule].push({ spec, originalExportName: expName, targetExportName, isType, unresolved });
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

  function collectUnresolvedExportNames(groups) {
    const names = [];
    for (const mod of Object.keys(groups)) {
      for (const d of groups[mod]) {
        if (d.unresolved) names.push(d.originalExportName);
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
    collectUnresolvedExportNames,
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
      [UNMAPPED_EXPORT_ID]:
        'Import{{plural}} "{{tokens}}" from legacy module "{{from}}" ha{{pluralVerb}} no known modern replacement yet. ' +
        'This import was left as-is and needs manual migration.',
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
      const unresolvedNames = helpers.collectUnresolvedExportNames(groups);

      if (!hasMapped && !unresolvedNames.length) return;

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
        // No fixer: we don't know where these tokens belong, so flag them for a human
        // instead of silently leaving the legacy import in place.
        context.report({
          node,
          messageId: UNMAPPED_EXPORT_ID,
          data: {
            from: fromModule,
            tokens: unresolvedNames.join(', '),
            plural: unresolvedNames.length > 1 ? 's' : '',
            pluralVerb: unresolvedNames.length > 1 ? 've' : 's',
          },
        });
      }
    }

    return {
      ImportDeclaration: handleImportDeclaration,
    };
  },
};
