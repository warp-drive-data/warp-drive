import { useEmber } from '@warp-drive/diagnostic/ember';
import { GraphqlRequestHandlerSpec } from '@warp-drive-internal/specs/graphql-request-handler.spec';

GraphqlRequestHandlerSpec.use(useEmber(), function (b) {
  b
    /* this comment just to make prettier behave */

    .test('it transforms a successful graphql response into a json:api document', function (props) {
      const { request, _getRequestState, countFor } = props;
      return <template>{{#let (_getRequestState request) as |state|}}Count:{{countFor
            state.result state.error
          }}{{/let}}</template>;
    })

    .test(
      'it transforms a paginated graphql connection into an array of resources with pageInfo meta',
      function (props) {
        const { request, _getRequestState, countFor } = props;
        return <template>{{#let (_getRequestState request) as |state|}}Count:{{countFor
              state.result state.error
            }}{{/let}}</template>;
      }
    )

    .test(
      "it rejects with an aggregate error when errorPolicy is 'all' and the response contains graphql errors",
      function (props) {
        const { request, _getRequestState, countFor } = props;
        return <template>{{#let (_getRequestState request) as |state|}}Count:{{countFor
              state.result state.error
            }}{{/let}}</template>;
      }
    )

    .test("it collects graphql errors into response meta when errorPolicy is 'ignore'", function (props) {
      const { request, _getRequestState, countFor } = props;
      return <template>{{#let (_getRequestState request) as |state|}}Count:{{countFor
            state.result state.error
          }}{{/let}}</template>;
    })

    .test('it does not transform responses from non-graphql endpoints', function (props) {
      const { request, _getRequestState, countFor } = props;
      return <template>{{#let (_getRequestState request) as |state|}}Count:{{countFor
            state.result state.error
          }}{{/let}}</template>;
    });
});
