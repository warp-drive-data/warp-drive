// @ts-nocheck
const rule = require('../src/rules/template-always-use-request-content');
const RuleTester = require('eslint').RuleTester;
const emberEslintParser = require('ember-eslint-parser');

// This rule operates on the Glimmer template AST that `ember-eslint-parser` exposes to
// ESLint for `.gjs`/`.gts` files. Test cases use `.gjs` (rather than `.gts`) so that the
// parser's babel-based mode is used and no TypeScript-specific setup is required.
const ruleTester = new RuleTester({
  languageOptions: {
    parser: emberEslintParser,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

const noBlocks = 'noBlocks';
const noBlockParam = 'noBlockParam';
const unusedResult = 'unusedResult';

/**
 * Wraps a `<template>` body in a minimal `.gjs` component module, matching how
 * `<Request>` is actually authored throughout this monorepo (exclusively in
 * `.gjs`/`.gts` First-Class Component Templates, never in standalone `.hbs`).
 *
 * @param {string} templateBody
 */
function wrap(templateBody) {
  return `
import { Request } from '@warp-drive/ember';
import Component from '@glimmer/component';

export default class Foo extends Component {
  <template>
${templateBody}
  </template>
}
`;
}

ruleTester.run('template-always-use-request-content', rule, {
  valid: [
    {
      name: 'content block captures and uses the result',
      filename: 'foo.gjs',
      code: wrap(`
        <Request @request={{@request}}>
          <:content as |result|>
            <h1>{{result.title}}</h1>
          </:content>
        </Request>
      `),
    },
    {
      name: 'result may be named anything the author likes',
      filename: 'foo.gjs',
      code: wrap(`
        <Request @request={{@request}}>
          <:content as |data|>
            <h1>{{data.title}}</h1>
          </:content>
        </Request>
      `),
    },
    {
      name: 'the second yielded "state" param may be used alongside the result',
      filename: 'foo.gjs',
      code: wrap(`
        <Request @request={{@request}}>
          <:content as |result state|>
            <h1>{{result.title}}</h1>
            {{#if state.isBackgroundReloading}}
              <SmallSpinner />
            {{/if}}
            <button {{on "click" state.refresh}}>Refresh</button>
          </:content>
        </Request>
      `),
    },
    {
      name: 'the second yielded "state" param may be captured and left unused',
      filename: 'foo.gjs',
      code: wrap(`
        <Request @request={{@request}}>
          <:content as |result state|>
            <h1>{{result.title}}</h1>
          </:content>
        </Request>
      `),
    },
    {
      name: 'result used only within a nested control-flow construct',
      filename: 'foo.gjs',
      code: wrap(`
        <Request @request={{@request}}>
          <:content as |result|>
            {{#if result.isActive}}
              <h1>{{result.title}}</h1>
            {{/if}}
          </:content>
        </Request>
      `),
    },
    {
      name: 'loading/error/content blocks combined, from the <Request> docs',
      filename: 'foo.gjs',
      code: wrap(`
        <Request @request={{@request}}>
          <:loading as |state|>
            <Spinner @percentDone={{state.completedRatio}} />
            <button {{on "click" state.abort}}>Cancel</button>
          </:loading>

          <:error as |error|>
            <ErrorForm @error={{error}} />
          </:error>

          <:content as |result|>
            <h1>{{result.title}}</h1>
          </:content>
        </Request>
      `),
    },
    {
      name: 'retry pattern from the <Request> docs',
      filename: 'foo.gjs',
      code: wrap(`
        <Request @request={{@request}}>
          <:cancelled as |error state|>
            <h2>The Request Cancelled</h2>
            <button {{on "click" state.retry}}>Retry</button>
          </:cancelled>

          <:error as |error state|>
            <ErrorForm @error={{error}} />
            <button {{on "click" state.retry}}>Retry</button>
          </:error>

          <:content as |result|>
            <h1>{{result.title}}</h1>
          </:content>
        </Request>
      `),
    },
    {
      name: 'no :content block, but other named blocks are present',
      filename: 'foo.gjs',
      code: wrap(`
        <Request @request={{@request}}>
          <:idle></:idle>
          <:loading></:loading>
        </Request>
      `),
    },
    {
      name: 'no :content block, only a single other named block is present',
      filename: 'foo.gjs',
      code: wrap(`
        <Request @request={{@request}}>
          <:cancelled>
            <h2>The Request Cancelled</h2>
          </:cancelled>
        </Request>
      `),
    },
    {
      name: 'nested <Request> usage: both the outer and the inner result are used',
      filename: 'foo.gjs',
      code: wrap(`
        <Request @request={{@request}}>
          <:content as |result state|>
            <Request @request={{state.latestRequest}}>
              <:loading></:loading>
            </Request>
            <h1>{{result.title}}</h1>
          </:content>
        </Request>
      `),
    },
    {
      name: 'nested <Request> usage where the inner :content shadows the outer result name, but both are used in their own scope',
      filename: 'foo.gjs',
      code: wrap(`
        <Request @request={{@request}}>
          <:content as |result state|>
            <Request @request={{state.latestRequest}}>
              <:content as |result|>
                {{result.subtitle}}
              </:content>
            </Request>
            <h1>{{result.title}}</h1>
          </:content>
        </Request>
      `),
    },
    {
      name: 'the outer result is used via the receiver of an `{{#each}}` that shadows it with the same name',
      filename: 'foo.gjs',
      code: wrap(`
        <Request @request={{@request}}>
          <:content as |result|>
            {{#each result.items as |result|}}
              {{result.name}}
            {{/each}}
          </:content>
        </Request>
      `),
    },
    {
      name: 'a non-<Request> element with a similarly named ":content" block is not linted',
      filename: 'foo.gjs',
      code: wrap(`
        <MyCustomComponent @request={{@request}}>
          <:content>
            unused on purpose
          </:content>
        </MyCustomComponent>
      `),
    },
    {
      name: 'a component whose tag merely contains "Request" is not linted',
      filename: 'foo.gjs',
      code: wrap(`
        <MyRequest @request={{@request}}>
          <:content>
            unused on purpose
          </:content>
        </MyRequest>
      `),
    },
  ],

  invalid: [
    {
      name: 'no :content block and no other named block either',
      filename: 'foo.gjs',
      code: wrap(`
        <Request @request={{@request}}>
          <SomeUnrelatedMarkup />
        </Request>
      `),
      errors: [{ messageId: noBlocks }],
    },
    {
      name: 'a completely empty, self-closing <Request>',
      filename: 'foo.gjs',
      code: wrap(`<Request @request={{@request}} />`),
      errors: [{ messageId: noBlocks }],
    },
    {
      name: ':content block present but the yielded result is not captured',
      filename: 'foo.gjs',
      code: wrap(`
        <Request @request={{@request}}>
          <:content>
            <SomeUnrelatedMarkup />
          </:content>
        </Request>
      `),
      errors: [{ messageId: noBlockParam }],
    },
    {
      name: ':content block captures the result but never uses it',
      filename: 'foo.gjs',
      code: wrap(`
        <Request @request={{@request}}>
          <:content as |result|>
            <SomeUnrelatedMarkup />
          </:content>
        </Request>
      `),
      errors: [{ messageId: unusedResult, data: { paramName: 'result' } }],
    },
    {
      name: ':content block captures both the result and state, but uses neither',
      filename: 'foo.gjs',
      code: wrap(`
        <Request @request={{@request}}>
          <:content as |result state|>
            <SomeUnrelatedMarkup />
          </:content>
        </Request>
      `),
      errors: [{ messageId: unusedResult, data: { paramName: 'result' } }],
    },
    {
      name: 'state is used but the result itself is still unused',
      filename: 'foo.gjs',
      code: wrap(`
        <Request @request={{@request}}>
          <:content as |result state|>
            <button {{on "click" state.refresh}}>Refresh</button>
          </:content>
        </Request>
      `),
      errors: [{ messageId: unusedResult, data: { paramName: 'result' } }],
    },
    {
      name: 'nested <Request> shadowing: the inner result is used but the outer one never is',
      filename: 'foo.gjs',
      code: wrap(`
        <Request @request={{@request}}>
          <:content as |result state|>
            <Request @request={{state.latestRequest}}>
              <:content as |result|>
                {{result.subtitle}}
              </:content>
            </Request>
          </:content>
        </Request>
      `),
      errors: [{ messageId: unusedResult, data: { paramName: 'result' } }],
    },
  ],
});
