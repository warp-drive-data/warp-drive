/**
 * {@include ./no-legacy-imports.md}
 *
 * @summary Lint rule, with autofix, that rewrites imports written against an older EmberData or WarpDrive release to
 * the modules that hold those exports in a newer one, and reports the imports it cannot rewrite.
 * @module
 */
'use strict';

const mapping = require('../legacy-import-mapping/index.js');

const RULE_ID = 'warp-drive.no-legacy-imports';
const PRIVATE_TARGET_ID = 'warp-drive.no-legacy-imports.private-target';
const REMOVED_ID = 'warp-drive.no-legacy-imports.removed';
const UNTRACKED_ID = 'warp-drive.no-legacy-imports.untracked';
const TYPE_ONLY_TARGET_ID = 'warp-drive.no-legacy-imports.type-only-target';
const SIDE_EFFECT_ID = 'warp-drive.no-legacy-imports.side-effect';

/** @type {Record<string, string>} */
const REPORT_MESSAGE = {
  removed: REMOVED_ID,
  untracked: UNTRACKED_ID,
  'type-only': TYPE_ONLY_TARGET_ID,
  'side-effect': SIDE_EFFECT_ID,
};

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/u;

/**
 * @param {string} version
 */
function label(version) {
  return version === 'head' ? mapping.HEAD_VERSION : version;
}

/**
 * The name a specifier imports: an export name, `default`, or `*` for a namespace import.
 * @param {any} spec
 * @returns {string}
 */
function importedName(spec) {
  if (spec.type === 'ImportDefaultSpecifier') return 'default';
  if (spec.type === 'ImportNamespaceSpecifier') return '*';
  return spec.imported.type === 'Identifier' ? spec.imported.name : String(spec.imported.value);
}

/**
 * @typedef {{ spec: any, name: string, local: string, isType: boolean, decision: any }} Item
 * @typedef {Item & { module: string, exportName: string }} Entry  an item placed in its target module
 */

/**
 * One specifier of a rendered declaration, keeping the local binding name.
 * @param {Entry} entry
 * @param {boolean} inlineType  whether to write `type` before a type-only specifier
 * @param {string} quote
 */
function specifierText(entry, inlineType, quote) {
  const type = inlineType && entry.isType ? 'type ' : '';
  if (entry.exportName === entry.local) return `${type}${entry.local}`;
  const exported = IDENTIFIER.test(entry.exportName) ? entry.exportName : `${quote}${entry.exportName}${quote}`;
  return `${type}${exported} as ${entry.local}`;
}

/**
 * The import declarations that bring `entries` in from `module`. Type-only entries alone become
 * `import type`; mixed with values they keep an inline `type`. A namespace import gets its own
 * declaration, because it cannot share one with named specifiers.
 * @param {string} module
 * @param {Entry[]} entries
 * @param {string} quote
 * @param {string} semi
 * @returns {string[]}
 */
function renderDeclarations(module, entries, quote, semi) {
  const from = ` from ${quote}${module}${quote}${semi}`;
  /** @type {string[]} */
  const declarations = [];
  const rest = entries.filter((entry) => entry.exportName !== '*');
  if (rest.length) {
    if (rest.every((entry) => entry.isType)) {
      const [only] = rest;
      declarations.push(
        rest.length === 1 && only.exportName === 'default'
          ? `import type ${only.local}${from}`
          : `import type { ${rest.map((entry) => specifierText(entry, false, quote)).join(', ')} }${from}`
      );
    } else {
      const head = rest.find((entry) => entry.exportName === 'default' && !entry.isType);
      const named = rest.filter((entry) => entry !== head).map((entry) => specifierText(entry, true, quote));
      const clause = [...(head ? [head.local] : []), ...(named.length ? [`{ ${named.join(', ')} }`] : [])];
      declarations.push(`import ${clause.join(', ')}${from}`);
    }
  }
  for (const entry of entries.filter((item) => item.exportName === '*')) {
    declarations.push(`import ${entry.isType ? 'type ' : ''}* as ${entry.local}${from}`);
  }
  return declarations;
}

/**
 * Whether `entries` can be added to the existing import declaration `target`.
 * @param {any} target
 * @param {Entry[]} entries
 */
function canMerge(target, entries) {
  if (entries.some((entry) => entry.exportName === '*')) return false;
  if ((target.attributes && target.attributes.length) || (target.assertions && target.assertions.length)) return false;
  const specs = target.specifiers;
  if (!specs.length || specs.some((/** @type {any} */ spec) => spec.type === 'ImportNamespaceSpecifier')) return false;
  if (target.importKind === 'type') {
    return (
      entries.every((entry) => entry.isType) &&
      specs.every((/** @type {any} */ spec) => spec.type === 'ImportSpecifier')
    );
  }
  return true;
}

/**
 * The range that removes `node`, with its line when nothing else is on it.
 * @param {any} sourceCode
 * @param {any} node
 * @returns {[number, number]}
 */
function removalRange(sourceCode, node) {
  const { text } = sourceCode;
  const [start, end] = node.range;
  let lineStart = start;
  while (lineStart > 0 && (text[lineStart - 1] === ' ' || text[lineStart - 1] === '\t')) lineStart--;
  let lineEnd = end;
  while (lineEnd < text.length && (text[lineEnd] === ' ' || text[lineEnd] === '\t')) lineEnd++;
  const startsLine = lineStart === 0 || text[lineStart - 1] === '\n';
  const endsLine = lineEnd === text.length || text[lineEnd] === '\n' || text[lineEnd] === '\r';
  if (!startsLine || !endsLine) return [start, end];
  if (text[lineEnd] === '\r') lineEnd++;
  if (text[lineEnd] === '\n') lineEnd++;
  return [lineStart, lineEnd];
}

/**
 * @param {Entry[]} entries
 */
function describeMoves(entries) {
  return entries
    .map((entry) => {
      if (entry.name === '*') return `the whole module to "${entry.module}"`;
      if (entry.name === entry.exportName) return `${entry.name} to "${entry.module}"`;
      return `${entry.name} to ${entry.exportName} in "${entry.module}"`;
    })
    .join(', ');
}

/**
 * @param {readonly { title: string, url: string }[] | undefined} links
 */
function describeLinks(links) {
  return links && links.length ? ` See: ${links.map((link) => `${link.title} (${link.url})`).join(', ')}.` : '';
}

/**
 * @summary ESLint rule object that autofixes imports written against an older EmberData or WarpDrive release and
 * reports the imports it cannot rewrite.
 * @type {import('eslint').Rule.RuleModule}
 */
module.exports = {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          from: { type: 'string' },
          to: { type: 'string' },
        },
        additionalProperties: false,
      },
    ],
    docs: {
      description:
        'Rewrites imports written against an older EmberData or WarpDrive release to the modules that hold them now.',
      recommended: false,
      url: 'https://warp-drive.io/api/eslint-plugin-warp-drive/rules/no-legacy-imports/',
    },
    messages: {
      [RULE_ID]: 'Imports from "{{module}}" moved in {{to}}: {{moves}}.',
      [PRIVATE_TARGET_ID]:
        'Imports from "{{module}}" moved in {{to}} to a private module: {{moves}}. The fix imports from there, but a ' +
        'private module can change in any release; prefer a public API if one covers your use.',
      [REMOVED_ID]:
        '{{subject}} has no replacement in {{to}}{{removedIn}}. The import is left as written.{{shim}}{{links}}',
      [UNTRACKED_ID]:
        '"{{module}}" did not export "{{name}}" in {{from}}, so there is no record of where it went. The import is left ' +
        'as written. Check the name, or set the `from` option to the release this code was written against.',
      [TYPE_ONLY_TARGET_ID]:
        '"{{name}}" from "{{module}}" is a value, but {{to}} only has a type for it: {{target}}. The import is left as ' +
        'written. Use `import type` if it is only used as a type{{typeThen}}; otherwise it needs manual migration.',
      [SIDE_EFFECT_ID]:
        'Importing "{{module}}" also sets things up as a side effect, so it cannot be rewritten to another module. ' +
        'The import is left as written; set up what it provided by hand.{{links}}',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    let map;
    try {
      map = mapping.loadMap({ from: options.from, to: options.to });
    } catch (error) {
      // Without shipped data there is nothing to check against; the rule stays silent.
      if (error && /** @type {any} */ (error).code === mapping.NO_DATA) return {};
      throw new Error(`no-legacy-imports: ${/** @type {Error} */ (error).message}`, { cause: error });
    }
    const sourceCode = context.sourceCode || context.getSourceCode();
    const versions = { from: label(map.from), to: label(map.to) };

    /**
     * @param {any} node
     */
    function plan(node) {
      const module = String(node.source.value);
      const declarationType = node.importKind === 'type';
      if (!node.specifiers.length) {
        const decision = map.resolve(module, '*', { typeOnly: declarationType });
        return { node, module, bare: true, decision, items: [], rewrites: decision.action === 'rewrite' };
      }
      /** @type {Item[]} */
      const items = node.specifiers.map((/** @type {any} */ spec) => {
        const name = importedName(spec);
        const isType = declarationType || spec.importKind === 'type';
        return {
          spec,
          name,
          local: spec.local.name,
          isType,
          decision: map.resolve(module, name, { typeOnly: isType }),
        };
      });
      const rewrites = items.some((item) => item.decision.action === 'rewrite');
      return { node, module, bare: false, decision: null, items, rewrites };
    }

    /**
     * Reports one item the map leaves in place but has something to say about.
     * @param {ReturnType<typeof plan>} declaration
     * @param {Item | null} item  null for a whole-module decision
     * @param {any} decision
     */
    function reportItem(declaration, item, decision) {
      const { module } = declaration;
      const name = item ? item.name : '*';
      const subject = name === '*' ? `"${module}"` : `"${name}" from "${module}"`;
      context.report({
        node: item ? item.spec : declaration.node,
        messageId: REPORT_MESSAGE[decision.reason] || REMOVED_ID,
        data: {
          ...versions,
          module,
          name,
          subject,
          target: decision.to ? `${decision.to.export} in "${decision.to.module}"` : '',
          // a type that kept the module and the name needs no rewrite once the import is type-only
          typeThen:
            decision.to && (decision.to.module !== module || decision.to.export !== name)
              ? ', and the rule then rewrites it'
              : '',
          removedIn: decision.removedIn ? ` (removed in ${decision.removedIn})` : '',
          shim: decision.shim ? `\n\nA shim that restores it:\n${decision.shim}\n` : '',
          // after a shim, the links start their own line
          links: decision.shim ? describeLinks(decision.links).trimStart() : describeLinks(decision.links),
        },
      });
    }

    /**
     * The reports, and the fix they share, for a declaration with at least one rewrite.
     * @param {ReturnType<typeof plan>} declaration
     * @param {ReturnType<typeof plan>[]} plans
     * @param {Map<string, ReturnType<typeof plan>>} createdBy  the first declaration that writes a
     *   new import of each module
     */
    function reportRewrites(declaration, plans, createdBy) {
      const { node, module } = declaration;
      const quote = sourceCode.getText(node.source)[0];
      const semi = sourceCode.getText(node).trimEnd().endsWith(';') ? ';' : '';

      /** @type {Entry[]} */
      const moved = [];
      /** @type {Map<string, Entry[]>} */
      const groups = new Map();
      const items = declaration.bare
        ? [{ spec: null, name: '*', local: '', isType: node.importKind === 'type', decision: declaration.decision }]
        : declaration.items;
      for (const item of items) {
        const target = item.decision.action === 'rewrite' ? item.decision.to : { module, export: item.name };
        /** @type {Entry} */
        const entry = { ...item, module: target.module, exportName: target.export };
        if (item.decision.action === 'rewrite') moved.push(entry);
        const group = groups.get(target.module);
        if (group) group.push(entry);
        else groups.set(target.module, [entry]);
      }

      /** @type {(fixer: any) => any[]} */
      let fix;
      if (declaration.bare) {
        const [entry] = moved;
        fix = (fixer) => [fixer.replaceText(node.source, `${quote}${entry.module}${quote}`)];
      } else {
        /** @type {{ target: any, entries: Entry[] }[]} */
        const merges = [];
        /** @type {Set<any>} */
        const deferTo = new Set();
        /** @type {string[]} */
        const rendered = [];
        for (const [target, entries] of groups) {
          if (target !== module) {
            const existing = plans.find(
              (other) =>
                other !== declaration && !other.rewrites && other.module === target && canMerge(other.node, entries)
            );
            if (existing) {
              merges.push({ target: existing.node, entries });
              continue;
            }
            // Another declaration earlier in the file writes a new import of this module too. This
            // fix overlaps that one, so ESLint applies it first and the next pass merges into it.
            const first = createdBy.get(target);
            if (first && first !== declaration) deferTo.add(first.node);
            else createdBy.set(target, declaration);
          }
          rendered.push(...renderDeclarations(target, entries, quote, semi));
        }
        const line = sourceCode.lines[node.loc.start.line - 1];
        const indent = /^\s*/u.exec(line.slice(0, node.loc.start.column))[0];
        fix = (fixer) => {
          const ops = [...deferTo].map((other) => fixer.replaceText(other, sourceCode.getText(other)));
          ops.push(
            rendered.length
              ? fixer.replaceText(node, rendered.join(`\n${indent}`))
              : fixer.removeRange(removalRange(sourceCode, node))
          );
          for (const { target, entries } of merges) ops.push(...mergeInto(fixer, target, entries, quote));
          return ops;
        };
      }

      const plain = moved.filter((entry) => entry.decision.reason !== 'private-target');
      const hidden = moved.filter((entry) => entry.decision.reason === 'private-target');
      if (plain.length) {
        context.report({ node, messageId: RULE_ID, data: { ...versions, module, moves: describeMoves(plain) }, fix });
      }
      if (hidden.length) {
        context.report({
          node,
          messageId: PRIVATE_TARGET_ID,
          data: { ...versions, module, moves: describeMoves(hidden) },
          fix,
        });
      }
    }

    /**
     * The edits that add `entries` to the existing declaration `target`.
     * @param {any} fixer
     * @param {any} target
     * @param {Entry[]} entries
     * @param {string} quote
     */
    function mergeInto(fixer, target, entries, quote) {
      const typeTarget = target.importKind === 'type';
      const specs = target.specifiers;
      const hasDefault = specs.some((/** @type {any} */ spec) => spec.type === 'ImportDefaultSpecifier');
      const head =
        typeTarget || hasDefault ? undefined : entries.find((entry) => entry.exportName === 'default' && !entry.isType);
      const named = entries.filter((entry) => entry !== head).map((entry) => specifierText(entry, !typeTarget, quote));
      const firstNamed = specs.find((/** @type {any} */ spec) => spec.type === 'ImportSpecifier');
      const lastNamed = [...specs].reverse().find((/** @type {any} */ spec) => spec.type === 'ImportSpecifier');
      const ops = [];
      if (head) ops.push(fixer.insertTextBefore(sourceCode.getTokenBefore(firstNamed), `${head.local}, `));
      if (named.length && lastNamed) {
        const brace = sourceCode.getTokenBefore(firstNamed);
        const multiline = brace.loc.start.line !== lastNamed.loc.start.line;
        const indent = multiline ? /^\s*/u.exec(sourceCode.lines[lastNamed.loc.start.line - 1])[0] : '';
        const separator = multiline ? `,\n${indent}` : ', ';
        ops.push(fixer.insertTextAfter(lastNamed, named.map((text) => `${separator}${text}`).join('')));
      } else if (named.length) {
        ops.push(fixer.insertTextAfter(specs[specs.length - 1], `, { ${named.join(', ')} }`));
      }
      return ops;
    }

    return {
      Program(program) {
        const plans = program.body
          .filter((/** @type {any} */ node) => node.type === 'ImportDeclaration')
          .map((/** @type {any} */ node) => plan(node));
        /** @type {Map<string, ReturnType<typeof plan>>} */
        const createdBy = new Map();
        for (const declaration of plans) {
          if (declaration.rewrites) reportRewrites(declaration, plans, createdBy);
          if (declaration.bare) {
            if (declaration.decision.action === 'report') reportItem(declaration, null, declaration.decision);
            continue;
          }
          const sideEffect = declaration.items.find(
            (item) => item.decision.action === 'report' && item.decision.reason === 'side-effect'
          );
          if (sideEffect) reportItem(declaration, null, sideEffect.decision);
          for (const item of declaration.items) {
            if (item.decision.action === 'report' && item.decision.reason !== 'side-effect') {
              reportItem(declaration, item, item.decision);
            }
          }
        }
      },
    };
  },
};
