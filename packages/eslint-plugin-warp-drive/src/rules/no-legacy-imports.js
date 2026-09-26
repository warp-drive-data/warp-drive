/**
 * {@include ./no-legacy-imports.md}
 *
 * @summary Lint rule, with autofix, that rewrites imports from legacy EmberData module paths to their modern
 * replacements.
 * @module
 */
'use strict';

const { listFromVersions, loadMap } = require('../legacy-import-mapping/index.js');

const RULE_ID = 'warp-drive.no-legacy-imports';
const UNMAPPED_EXPORT_ID = 'warp-drive.no-legacy-imports.unmapped-export';
const LEGACY_HOME_ID = 'warp-drive.no-legacy-imports.legacy-home';
const TYPE_ONLY_TARGET_ID = 'warp-drive.no-legacy-imports.type-only-target';
const MESSAGE_FOR = {
  removed: UNMAPPED_EXPORT_ID,
  untracked: UNMAPPED_EXPORT_ID,
  legacy: LEGACY_HOME_ID,
  'type-only': TYPE_ONLY_TARGET_ID,
};

function importedName(spec) {
  if (spec.type === 'ImportDefaultSpecifier') return 'default';
  if (spec.type === 'ImportNamespaceSpecifier') return '*';
  return spec.imported.name;
}

function renderGroup(sourceCode, module, items, quote) {
  const allType = items.every((item) => item.isType);
  const defaults = [];
  const namespaces = [];
  const named = [];
  for (const { spec, name, isType } of items) {
    const local = spec.local.name;
    if (name === '*') namespaces.push(sourceCode.getText(spec));
    else if (name === 'default') defaults.push(local);
    else named.push(`${isType && !allType ? 'type ' : ''}${name === local ? name : `${name} as ${local}`}`);
  }
  const clause = [...defaults, ...namespaces, ...(named.length ? [`{ ${named.join(', ')} }`] : [])].join(', ');
  return `import ${allType ? 'type ' : ''}${clause} from ${quote}${module}${quote};`;
}

/**
 * @summary ESLint rule object that autofixes imports from legacy EmberData module paths to their modern replacements.
 * @type {import('eslint').Rule.RuleModule}
 */
module.exports = {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: { from: { enum: listFromVersions() } },
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
      [TYPE_ONLY_TARGET_ID]:
        'Import{{plural}} "{{tokens}}" from "{{from}}" {{verb}} no value export in {{to}}, only a type. ' +
        'This import was left as-is. Use `import type` if it is only used as a type; otherwise it needs manual migration.',
    },
  },

  create(context) {
    const map = loadMap(context.options[0] && context.options[0].from);
    const sourceCode = context.sourceCode || context.getSourceCode();

    return {
      ImportDeclaration(node) {
        const from = String(node.source.value);
        const items = node.specifiers.map((spec) => {
          const name = importedName(spec);
          const isType = node.importKind === 'type' || spec.importKind === 'type';
          return { spec, name, isType, decision: map.resolve(from, name, { typeOnly: isType }) };
        });

        const reported = { [UNMAPPED_EXPORT_ID]: [], [LEGACY_HOME_ID]: [], [TYPE_ONLY_TARGET_ID]: [] };
        const groups = new Map();
        for (const { spec, name, isType, decision } of items) {
          if (decision.action === 'report') reported[MESSAGE_FOR[decision.reason]].push(name);
          const to = decision.action === 'rewrite' ? decision.to : { module: from, export: name };
          if (!groups.has(to.module)) groups.set(to.module, []);
          groups.get(to.module).push({ spec, name: to.export, isType });
        }

        if (items.some((item) => item.decision.action === 'rewrite')) {
          const quote = sourceCode.getText(node.source)[0];
          context.report({
            node,
            messageId: RULE_ID,
            data: { from },
            fix: (fixer) =>
              fixer.replaceText(
                node,
                [...groups].map(([module, group]) => renderGroup(sourceCode, module, group, quote)).join('\n')
              ),
          });
        }

        for (const [messageId, tokens] of Object.entries(reported)) {
          if (!tokens.length) continue;
          const many = tokens.length > 1;
          context.report({
            node,
            messageId,
            data: {
              from,
              to: map.to,
              tokens: tokens.join(', '),
              plural: many ? 's' : '',
              verb: many ? 'have' : 'has',
              s: many ? '' : 's',
            },
          });
        }
      },
    };
  },
};
