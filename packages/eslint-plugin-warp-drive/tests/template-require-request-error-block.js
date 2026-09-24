// @ts-nocheck
const rule = require('../src/rules/template-require-request-error-block');
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

const noErrorBlock = 'noErrorBlock';

/**
 * Wraps a `<template>` body in a minimal `.gjs` component module, matching how
 * `<Request>`/`<Await>` are actually authored throughout this monorepo (exclusively in
 * `.gjs`/`.gts` First-Class Component Templates, never in standalone `.hbs`).
 *
 * @param {string} templateBody
 */
function wrap(templateBody) {
  return `
import { Request, Await } from '@warp-drive/ember';
import Component from '@glimmer/component';

export default class Foo extends Component {
  <template>
${templateBody}
  </template>
}
`;
}

ruleTester.run('template-require-request-error-block', rule, {
  valid: [
    {
      name: '<Request> with an :error block alongside other blocks',
      filename: 'foo.gjs',
      code: wrap(`
        <Request @request={{@request}}>
          <:loading as |state|>
            <Spinner @percentDone={{state.completedRatio}} />
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
      name: '<Await> with an :error block alongside :pending/:success',
      filename: 'foo.gjs',
      code: wrap(`
        <Await @promise={{@promise}}>
          <:pending>
            <Spinner />
          </:pending>

          <:error as |error|>
            <ErrorForm @error={{error}} />
          </:error>

          <:success as |result|>
            <h1>{{result.title}}</h1>
          </:success>
        </Await>
      `),
    },
    {
      name: '<Request> where :error is the only block present',
      filename: 'foo.gjs',
      code: wrap(`
        <Request @request={{@request}}>
          <:error as |error|>
            <ErrorForm @error={{error}} />
          </:error>
        </Request>
      `),
    },
    {
      name: '<Await> where :error is the only block present',
      filename: 'foo.gjs',
      code: wrap(`
        <Await @promise={{@promise}}>
          <:error as |error|>
            <ErrorForm @error={{error}} />
          </:error>
        </Await>
      `),
    },
    {
      name: 'a component whose tag merely contains "Request" is not linted',
      filename: 'foo.gjs',
      code: wrap(`
        <MyRequest @request={{@request}}>
          <:content>
            no :error block, but this isn't a real Request
          </:content>
        </MyRequest>
      `),
    },
  ],

  invalid: [
    {
      name: 'a completely empty, self-closing <Request>',
      filename: 'foo.gjs',
      code: wrap(`<Request @request={{@request}} />`),
      errors: [{ messageId: noErrorBlock, data: { tag: 'Request' } }],
    },
    {
      name: 'a completely empty, self-closing <Await>',
      filename: 'foo.gjs',
      code: wrap(`<Await @promise={{@promise}} />`),
      errors: [{ messageId: noErrorBlock, data: { tag: 'Await' } }],
    },
    {
      name: '<Request> with other named blocks but no :error block',
      filename: 'foo.gjs',
      code: wrap(`
        <Request @request={{@request}}>
          <:loading as |state|>
            <Spinner @percentDone={{state.completedRatio}} />
          </:loading>

          <:content as |result|>
            <h1>{{result.title}}</h1>
          </:content>
        </Request>
      `),
      errors: [{ messageId: noErrorBlock, data: { tag: 'Request' } }],
    },
    {
      name: '<Await> with other named blocks but no :error block',
      filename: 'foo.gjs',
      code: wrap(`
        <Await @promise={{@promise}}>
          <:pending>
            <Spinner />
          </:pending>

          <:success as |result|>
            <h1>{{result.title}}</h1>
          </:success>
        </Await>
      `),
      errors: [{ messageId: noErrorBlock, data: { tag: 'Await' } }],
    },
    {
      name: '<Request> with only a plain/default (non-named) block and no :error',
      filename: 'foo.gjs',
      code: wrap(`
        <Request @request={{@request}}>
          <SomeUnrelatedMarkup />
        </Request>
      `),
      errors: [{ messageId: noErrorBlock, data: { tag: 'Request' } }],
    },
  ],
});
