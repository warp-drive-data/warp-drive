import { useEmber } from '@warp-drive/diagnostic/ember';
import { GraphqlRequestHandlerSpec } from '@warp-drive-internal/specs/graphql-request-handler.spec';

GraphqlRequestHandlerSpec.use(useEmber(), function (b) {
  b
    /* this comment just to make prettier behave */

    .test('it transforms a successful graphql response into a json:api document', function (props) {
      const { request, _getRequestState, countFor } = props;
      return <template>
        {{#let (_getRequestState request) as |state|}}Count:{{countFor state.result state.error}}{{/let}}
      </template>;
    })

    .test(
      'it transforms a paginated graphql connection into an array of resources with pageInfo meta',
      function (props) {
        const { request, _getRequestState, countFor } = props;
        return <template>
          {{#let (_getRequestState request) as |state|}}Count:{{countFor state.result state.error}}{{/let}}
        </template>;
      }
    )

    .test(
      "it rejects with an aggregate error when errorPolicy is 'all' and the response contains graphql errors",
      function (props) {
        const { request, _getRequestState, countFor } = props;
        return <template>
          {{#let (_getRequestState request) as |state|}}Count:{{countFor state.result state.error}}{{/let}}
        </template>;
      }
    )

    .test(
      "it rejects with an aggregate error when errorPolicy is 'all' and the root field is an Error union member",
      function (props) {
        const { request, _getRequestState, countFor } = props;
        return <template>
          {{#let (_getRequestState request) as |state|}}Count:{{countFor state.result state.error}}{{/let}}
        </template>;
      }
    )

    .test('it unwraps a Success union member into its nested resource', function (props) {
      const { request, _getRequestState, countFor } = props;
      return <template>
        {{#let (_getRequestState request) as |state|}}Count:{{countFor state.result state.error}}{{/let}}
      </template>;
    })

    .test('it resolves a null root field to null data', function (props) {
      const { request, _getRequestState, countFor } = props;
      return <template>
        {{#let (_getRequestState request) as |state|}}Count:{{countFor state.result state.error}}{{/let}}
      </template>;
    })

    .test('it keeps a scalar root result in meta', function (props) {
      const { request, _getRequestState, countFor } = props;
      return <template>
        {{#let (_getRequestState request) as |state|}}Count:{{countFor state.result state.error}}{{/let}}
      </template>;
    })

    .test('it keeps a root object without __typename in meta', function (props) {
      const { request, _getRequestState, countFor } = props;
      return <template>
        {{#let (_getRequestState request) as |state|}}Count:{{countFor state.result state.error}}{{/let}}
      </template>;
    })

    .test('it rejects a mutation that has graphql errors without an errorPolicy', function (props) {
      const { request, _getRequestState, countFor } = props;
      return <template>
        {{#let (_getRequestState request) as |state|}}Count:{{countFor state.result state.error}}{{/let}}
      </template>;
    })

    .test('it lets a mutation choose its errorPolicy', function (props) {
      const { request, _getRequestState, countFor } = props;
      return <template>
        {{#let (_getRequestState request) as |state|}}Count:{{countFor state.result state.error}}{{/let}}
      </template>;
    })

    .test('it keeps the result of a delete in meta instead of turning it into a resource', function (props) {
      const { request, _getRequestState, countFor } = props;
      return <template>
        {{#let (_getRequestState request) as |state|}}Count:{{countFor state.result state.error}}{{/let}}
      </template>;
    })

    .test('it keeps each value of a field with arguments under its own key', function (props) {
      const { request, _getRequestState, countFor } = props;
      return <template>
        {{#let (_getRequestState request) as |state|}}Count:{{countFor state.result state.error}}{{/let}}
      </template>;
    })

    .test('it keeps the arguments of a field below a connection', function (props) {
      const { request, _getRequestState, countFor } = props;
      return <template>
        {{#let (_getRequestState request) as |state|}}Count:{{countFor state.result state.error}}{{/let}}
      </template>;
    })

    .test('it leaves a field without arguments as a relationship', function (props) {
      const { request, _getRequestState, countFor } = props;
      return <template>
        {{#let (_getRequestState request) as |state|}}Count:{{countFor state.result state.error}}{{/let}}
      </template>;
    })

    .test("it collects graphql errors into response meta when errorPolicy is 'ignore'", function (props) {
      const { request, _getRequestState, countFor } = props;
      return <template>
        {{#let (_getRequestState request) as |state|}}Count:{{countFor state.result state.error}}{{/let}}
      </template>;
    })

    .test('it does not transform responses from non-graphql endpoints', function (props) {
      const { request, _getRequestState, countFor } = props;
      return <template>
        {{#let (_getRequestState request) as |state|}}Count:{{countFor state.result state.error}}{{/let}}
      </template>;
    });
});
