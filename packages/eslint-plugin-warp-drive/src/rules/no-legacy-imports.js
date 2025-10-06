'use strict';

const path = require('path');

const RULE_ID = 'warp-drive.no-legacy-imports';

function buildMapping() {
  const mappingArray = require(path.join(__dirname, '../public-exports-mapping-5.5.enriched.json'));

  /**
   * Map key: `${module}::${exportName}` where exportName can be 'default'.
   * Map value: replacement module string
   */
  const lookup = new Map();

  if (Array.isArray(mappingArray)) {
    for (const entry of mappingArray) {
      const srcMod = entry.module;
      const exp = entry.export;
      const repl = entry.replacement;
      if (!srcMod || !exp || !repl || !repl.module) continue;
      lookup.set(`${srcMod}::${exp}`, {
        module: repl.module,
        exportName: repl.export ?? 'default',
        isType: Boolean(repl.isTypeExport),
      });
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

  function getSpecifierImportKind(spec, declarationKind) {
    if (spec.importKind) {
      return spec.importKind;
    }
    if (declarationKind) {
      return declarationKind;
    }
    return 'value';
  }

  function groupImportSpecifiersByTarget(moduleName, specifiers, declarationKind) {
    /** @type {Map<string, any[]>} */
    const groups = new Map();
    /** @type {string[]} */
    const order = [];

    const ensureGroup = (mod) => {
      if (!groups.has(mod)) {
        groups.set(mod, []);
        order.push(mod);
      }
      return groups.get(mod);
    };

    for (const spec of specifiers) {
      if (spec.type === 'ImportNamespaceSpecifier') {
        const info = {
          spec,
          targetModule: moduleName,
          originalImportedName: '*',
          targetExportName: '*',
          importKind: 'value',
          localName: spec.local ? spec.local.name : null,
          isNamespace: true,
          isDefault: false,
          originalText: sourceCode.getText(spec),
        };
        ensureGroup(moduleName).push(info);
        continue;
      }

      const expName = getImportExportNameFromImportSpecifier(spec);
      const mapping = expName ? MAPPING.get(`${moduleName}::${expName}`) : null;
      const targetModule = mapping ? mapping.module : moduleName;
      const targetExportName = mapping ? mapping.exportName : expName;
      const info = {
        spec,
        targetModule,
        originalImportedName: expName,
        targetExportName,
        importKind: getSpecifierImportKind(spec, declarationKind),
        localName: spec.local ? spec.local.name : null,
        isNamespace: false,
        isDefault: spec.type === 'ImportDefaultSpecifier',
        originalText: sourceCode.getText(spec),
      };
      ensureGroup(targetModule).push(info);
    }

    return { groups, order };
  }

  function hasAnyMappedTarget(groups, originalModule) {
    for (const [targetModule, items] of groups) {
      if (targetModule !== originalModule) {
        return true;
      }
      for (const item of items) {
        if (!item.isNamespace && item.targetExportName && item.targetExportName !== item.originalImportedName) {
          return true;
        }
      }
    }
    return false;
  }

  function buildImportTextForGroup(groupModule, entries, quote) {
    if (!entries.length) {
      return '';
    }

    if (entries.some((entry) => entry.isNamespace)) {
      // Namespace imports are not auto-fixed to avoid generating invalid syntax.
      return '';
    }

    const defaultEntries = [];
    const namedEntries = [];
    for (const entry of entries) {
      const treatAsDefault = entry.targetExportName === 'default' || (entry.isDefault && entry.importKind === 'type');
      if (treatAsDefault) {
        defaultEntries.push(entry);
      } else {
        namedEntries.push(entry);
      }
    }

    if (defaultEntries.length > 1) {
      return '';
    }

    const allType = entries.every((entry) => entry.importKind === 'type');
    const useTopLevelType = allType && !(defaultEntries.length && namedEntries.length);

    if (defaultEntries.length === 1 && defaultEntries[0].importKind === 'type' && !useTopLevelType) {
      return '';
    }

    if (!defaultEntries.length && !namedEntries.length) {
      return '';
    }

    const parts = ['import '];
    if (useTopLevelType) {
      parts.push('type ');
    }

    if (defaultEntries.length) {
      const entry = defaultEntries[0];
      const localName = entry.localName || 'default';
      parts.push(localName);
    }

    if (namedEntries.length) {
      if (defaultEntries.length) {
        parts.push(', ');
      }
      parts.push('{ ');
      const namedTexts = namedEntries.map((entry) => {
        const typePrefix = entry.importKind === 'type' && !useTopLevelType ? 'type ' : '';
        const importedName = entry.targetExportName;
        const alias = entry.localName && entry.localName !== importedName ? ` as ${entry.localName}` : '';
        return `${typePrefix}${importedName}${alias}`;
      });
      parts.push(namedTexts.join(', '));
      parts.push(' }');
    }

    parts.push(' from ', quote, groupModule, quote, ';');
    return parts.join('');
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
        'Rewrites legacy Ember Data import module specifiers to their modern replacements using an embedded mapping.',
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

      const { groups, order } = helpers.groupImportSpecifiersByTarget(fromModule, node.specifiers, node.importKind);
      const hasMapped = helpers.hasAnyMappedTarget(groups, fromModule);
      if (!hasMapped) return;

      const quote = helpers.getQuoteChar(node);

      if (groups.size === 1) {
        const onlyModule = order[0];
        const entries = groups.get(onlyModule) || [];
        const canUpdateModuleOnly =
          onlyModule !== fromModule && entries.every((entry) => entry.targetExportName === entry.originalImportedName);

        if (canUpdateModuleOnly) {
          context.report({
            node,
            messageId: RULE_ID,
            data: { kind: 'import', from: fromModule },
            fix(fixer) {
              const newText = `${quote}${onlyModule}${quote}`;
              return fixer.replaceText(node.source, newText);
            },
          });
          return;
        }
      }

      context.report({
        node,
        messageId: RULE_ID,
        data: { kind: 'import', from: fromModule },
        fix(fixer) {
          const pieces = [];
          for (const mod of order) {
            const specs = groups.get(mod) || [];
            const text = helpers.buildImportTextForGroup(mod, specs, quote);
            if (!text) {
              return null;
            }
            pieces.push(text);
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
