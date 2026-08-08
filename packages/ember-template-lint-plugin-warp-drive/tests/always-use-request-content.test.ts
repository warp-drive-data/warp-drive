import { beforeEach, describe, expect, it } from 'vitest';

import { generateRuleTests } from 'ember-template-lint';

import plugin from '../src/index.js';

const NO_BLOCKS_MESSAGE =
  'Using <Request> without a :content block (or any other named block such as :idle, :loading, ' +
  ':error, :cancelled, or :always) discards the request entirely. Add a :content block to use ' +
  'the request result, or another named block if you only need to react to loading/error/etc states.';

const NO_BLOCK_PARAM_MESSAGE =
  'The :content block of <Request> must capture the yielded request result (e.g. ' +
  '`<:content as |result|>`) rather than discarding it. If you truly do not need the result, ' +
  'remove the :content block.';

function unusedResultMessage(paramName: string): string {
  return (
    `The value yielded by the :content block of <Request> ("${paramName}") is captured but ` +
    `never used. This often means the result is being consumed indirectly (e.g. by re-reading ` +
    `it from the store elsewhere), which defeats the purpose of <Request>. Use "${paramName}", ` +
    `or remove the :content block if the result is genuinely not needed.`
  );
}

function expectSingleMessage(message: string) {
  return (results: { message: string }[]) => {
    expect(results).toHaveLength(1);
    expect(results[0]?.message).toBe(message);
  };
}

generateRuleTests({
  name: 'always-use-request-content',

  groupMethodBefore: beforeEach,
  groupingMethod: describe,
  testMethod: it,
  plugins: [plugin],

  config: true,

  good: [
    {
      name: 'content block captures and uses the result',
      template: `
        <Request @request={{@request}}>
          <:content as |result|>
            <h1>{{result.title}}</h1>
          </:content>
        </Request>
      `,
    },
    {
      name: 'result may be named anything the author likes',
      template: `
        <Request @request={{@request}}>
          <:content as |data|>
            <h1>{{data.title}}</h1>
          </:content>
        </Request>
      `,
    },
    {
      name: 'the second yielded "state" param may be used alongside the result',
      template: `
        <Request @request={{@request}}>
          <:content as |result state|>
            <h1>{{result.title}}</h1>
            {{#if state.isBackgroundReloading}}
              <SmallSpinner />
            {{/if}}
            <button {{on "click" state.refresh}}>Refresh</button>
          </:content>
        </Request>
      `,
    },
    {
      name: 'the second yielded "state" param may be captured and left unused',
      template: `
        <Request @request={{@request}}>
          <:content as |result state|>
            <h1>{{result.title}}</h1>
          </:content>
        </Request>
      `,
    },
    {
      name: 'result used only within a nested control-flow construct',
      template: `
        <Request @request={{@request}}>
          <:content as |result|>
            {{#if result.isActive}}
              <h1>{{result.title}}</h1>
            {{/if}}
          </:content>
        </Request>
      `,
    },
    {
      name: 'loading/error/content blocks combined, from the <Request> docs',
      template: `
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
      `,
    },
    {
      name: 'retry pattern from the <Request> docs',
      template: `
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
      `,
    },
    {
      name: 'no :content block, but other named blocks are present',
      template: `
        <Request @request={{@request}}>
          <:idle></:idle>
          <:loading></:loading>
        </Request>
      `,
    },
    {
      name: 'no :content block, only a single other named block is present',
      template: `
        <Request @request={{@request}}>
          <:cancelled>
            <h2>The Request Cancelled</h2>
          </:cancelled>
        </Request>
      `,
    },
    {
      name: 'nested <Request> usage: both the outer and the inner result are used',
      template: `
        <Request @request={{@request}}>
          <:content as |result state|>
            <Request @request={{state.latestRequest}}>
              <:loading></:loading>
            </Request>
            <h1>{{result.title}}</h1>
          </:content>
        </Request>
      `,
    },
    {
      name: 'nested <Request> usage where the inner :content shadows the outer result name, but both are used in their own scope',
      template: `
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
      `,
    },
    {
      name: 'the outer result is used via the receiver of an `{{#each}}` that shadows it with the same name',
      template: `
        <Request @request={{@request}}>
          <:content as |result|>
            {{#each result.items as |result|}}
              {{result.name}}
            {{/each}}
          </:content>
        </Request>
      `,
    },
    {
      name: 'a non-<Request> element with a similarly named ":content" block is not linted',
      template: `
        <MyCustomComponent @request={{@request}}>
          <:content>
            unused on purpose
          </:content>
        </MyCustomComponent>
      `,
    },
    {
      name: 'a component whose tag merely contains "Request" is not linted',
      template: `
        <MyRequest @request={{@request}}>
          <:content>
            unused on purpose
          </:content>
        </MyRequest>
      `,
    },
  ],

  bad: [
    {
      name: 'no :content block and no other named block either',
      template: `
        <Request @request={{@request}}>
          <SomeUnrelatedMarkup />
        </Request>
      `,
      verifyResults: expectSingleMessage(NO_BLOCKS_MESSAGE),
    },
    {
      name: 'a completely empty, self-closing <Request>',
      template: `<Request @request={{@request}} />`,
      verifyResults: expectSingleMessage(NO_BLOCKS_MESSAGE),
    },
    {
      name: ':content block present but the yielded result is not captured',
      template: `
        <Request @request={{@request}}>
          <:content>
            <SomeUnrelatedMarkup />
          </:content>
        </Request>
      `,
      verifyResults: expectSingleMessage(NO_BLOCK_PARAM_MESSAGE),
    },
    {
      name: ':content block captures the result but never uses it',
      template: `
        <Request @request={{@request}}>
          <:content as |result|>
            <SomeUnrelatedMarkup />
          </:content>
        </Request>
      `,
      verifyResults: expectSingleMessage(unusedResultMessage('result')),
    },
    {
      name: ':content block captures both the result and state, but uses neither',
      template: `
        <Request @request={{@request}}>
          <:content as |result state|>
            <SomeUnrelatedMarkup />
          </:content>
        </Request>
      `,
      verifyResults: expectSingleMessage(unusedResultMessage('result')),
    },
    {
      name: 'state is used but the result itself is still unused',
      template: `
        <Request @request={{@request}}>
          <:content as |result state|>
            <button {{on "click" state.refresh}}>Refresh</button>
          </:content>
        </Request>
      `,
      verifyResults: expectSingleMessage(unusedResultMessage('result')),
    },
    {
      name: 'nested <Request> shadowing: the inner result is used but the outer one never is',
      template: `
        <Request @request={{@request}}>
          <:content as |result state|>
            <Request @request={{state.latestRequest}}>
              <:content as |result|>
                {{result.subtitle}}
              </:content>
            </Request>
          </:content>
        </Request>
      `,
      verifyResults: expectSingleMessage(unusedResultMessage('result')),
    },
  ],
});
