import { parse } from 'graphql';

import { fieldKey } from '@ember-data/request-utils/graphql';
import { module, test } from '@warp-drive/diagnostic';
import { GraphQLToJSONAPIHandler } from '@warp-drive/utilities/handlers';

function attributesOf(
  query: string,
  variables: Record<string, unknown>,
  response: Record<string, unknown>
): Record<string, unknown> {
  const document = parse(query);
  const handler = new GraphQLToJSONAPIHandler() as unknown as {
    transformGraphQLToJSONAPI(
      response: unknown,
      options: { details: { document: typeof document; operationName: string; variables: typeof variables } }
    ): { data: { attributes: Record<string, unknown> } };
  };

  return handler.transformGraphQLToJSONAPI(
    { data: { project: { __typename: 'Project', id: '1', ...response } } },
    { details: { document, operationName: 'Q', variables } }
  ).data.attributes;
}

const MEMBERS = [{ __typename: 'Member', id: 'a' }];
const REF = { $refs: [{ type: 'member', id: 'a' }] };

module('GraphQL | Fields with arguments', function () {
  test('fieldKey sorts the keys of the arguments', function (assert) {
    assert.equal(
      fieldKey('memberList', { to: '2026-01-31', from: '2026-01-01' }),
      'memberList({"from":"2026-01-01","to":"2026-01-31"})'
    );
    assert.equal(fieldKey('memberList'), 'memberList({})');
  });

  test('an argument that is a variable is resolved, and falls back to its default', function (assert) {
    const query = `query Q($to: String = "2026-01-31") { project { id memberList(from: "a", to: $to) { id } } }`;

    assert.deepEqual(
      attributesOf(query, {}, { memberList: MEMBERS }),
      { 'memberList({"from":"a","to":"2026-01-31"})': REF },
      'the default is used when the variable is not passed'
    );
    assert.deepEqual(
      attributesOf(query, { to: '2026-02-28' }, { memberList: MEMBERS }),
      { 'memberList({"from":"a","to":"2026-02-28"})': REF },
      'the variable is used when it is passed'
    );
  });

  test('a variable passed as undefined falls back to its default', function (assert) {
    const query = `query Q($to: String = "2026-01-31") { project { id memberList(to: $to) { id } } }`;

    assert.deepEqual(attributesOf(query, { to: undefined }, { memberList: MEMBERS }), {
      'memberList({"to":"2026-01-31"})': REF,
    });
  });

  test('an empty list is kept as an empty list of refs', function (assert) {
    const query = `query Q { project { id memberList(first: 3) { id } } }`;

    assert.deepEqual(attributesOf(query, {}, { memberList: [] }), { 'memberList({"first":3})': { $refs: [] } });
  });

  test('an argument that has no value is left out of the key', function (assert) {
    const query = `query Q($from: String) { project { id memberList(from: $from, first: 3) { id } } }`;

    assert.deepEqual(attributesOf(query, {}, { memberList: MEMBERS }), { 'memberList({"first":3})': REF });
  });

  test('fields in fragments are found, and list, object and enum arguments are resolved', function (assert) {
    const query = `
      query Q { project { id ...Details ... on Project { tags(filter: { labels: ["x"], kind: ADMIN }) } } }
      fragment Details on Project { memberList(first: 3) { id } }
    `;

    assert.deepEqual(attributesOf(query, {}, { memberList: MEMBERS, tags: ['t'] }), {
      'memberList({"first":3})': REF,
      'tags({"filter":{"kind":"ADMIN","labels":["x"]}})': ['t'],
    });
  });

  test('a field without arguments keeps the key it has in the response', function (assert) {
    const query = `query Q { project { id members: memberList { id } } }`;

    assert.deepEqual(Object.keys(attributesOf(query, {}, { members: MEMBERS })), [], 'it is not renamed');
  });
});
