import { describe, expect, test } from 'vitest';

import { parseAQL, type FieldSchema, type Schemas } from '@warp-drive/experiments/aql';

function makeSchemas(): Schemas {
  const company = new Map<string, FieldSchema>([
    ['name', { type: null, name: 'name', kind: 'attribute' }],
    ['ceo', { type: 'employee', name: 'ceo', kind: 'resource' }],
  ]);
  const employee = new Map<string, FieldSchema>([
    ['name', { type: null, name: 'name', kind: 'attribute' }],
    ['profileImage', { type: null, name: 'profileImage', kind: 'attribute' }],
    ['manager', { type: 'employee', name: 'manager', kind: 'resource' }],
  ]);
  return new Map([
    ['company', company],
    ['employee', employee],
  ]);
}

const WITH_COMMENTS = `
# /companies-query.aql
# This is a Comment
QUERY company { # we wrap our query definition in QUERY {} and specify the primary resource type
  data { # the graph of data we want back goes in data
    name
    ceo { # relationships with {} after them will be included
      name
      # if ceo is an employee and something else
      # also declares fields for an employee, the
      # field sets will be merged
      profileImage
    }
  }
  filter {
    # @arg is used to declare variables
    @arg(null,string) size = "large"
  }
  # statements may be ended by a \`;\`, \`#\`, \`}\` or newline
  page { size = 10 }
}
`;

const WITHOUT_COMMENTS = `
QUERY company {
  data {
    name
    ceo { name; profileImage  }
  }
  filter {
    @arg(null,string) size = "large"
  }
  page { size = 10 }
}
`;

describe('parseAQL', () => {
  test('compiles the "at a glance" example (with comments)', async () => {
    const result = await parseAQL(WITH_COMMENTS, makeSchemas());

    expect(result['q:type']).toBe('company');
    expect(result['q:search']).toEqual({
      fields: {
        company: ['name', 'ceo'],
        employee: ['name', 'profileImage'],
      },
      include: 'ceo',
      filter: { $size: 'null,string' },
      page: { size: 10 },
    });
    expect(result['q:defaults']).toEqual({
      filter: { size: 'large' },
    });
    expect(result['q:id']).toMatch(/^[0-9a-f]{64}$/);
  });

  test('comments do not change the compiled query shape', async () => {
    const withComments = await parseAQL(WITH_COMMENTS, makeSchemas());
    const withoutComments = await parseAQL(WITHOUT_COMMENTS, makeSchemas());

    expect(withoutComments['q:search']).toEqual(withComments['q:search']);
    expect(withoutComments['q:defaults']).toEqual(withComments['q:defaults']);
    // different source text (comments) still hashes to a different persisted-query id
    expect(withoutComments['q:id']).not.toBe(withComments['q:id']);
  });

  test('supports the terse block form with no whitespace before a closing brace', async () => {
    const result = await parseAQL('QUERY employee {data{name;profileImage}}', makeSchemas());

    expect(result['q:search']).toEqual({
      fields: { employee: ['name', 'profileImage'] },
    });
  });

  test('merges field selections when the same related type is reached twice', async () => {
    const result = await parseAQL(
      `QUERY employee {
        data {
          manager { name }
          name
          manager { profileImage }
        }
      }`,
      makeSchemas()
    );

    expect(result['q:search'].fields).toEqual({
      employee: ['manager', 'name', 'profileImage'],
    });
    expect(result['q:search'].include).toBe('manager');
  });

  test('infers the @arg type from its initializer when no type list is given', async () => {
    const result = await parseAQL(
      `QUERY employee {
        data { name }
        page { @arg limit = 10 }
      }`,
      makeSchemas()
    );

    expect(result['q:search'].page).toEqual({ $limit: 'number' });
    expect(result['q:defaults']).toEqual({ page: { limit: 10 } });
  });

  test('supports escaped quotes inside string literals', async () => {
    const result = await parseAQL(
      `QUERY employee {
        data { name }
        filter { label = "say \\"hi\\"" }
      }`,
      makeSchemas()
    );

    expect(result['q:search'].filter).toEqual({ label: 'say "hi"' });
  });

  test('throws a descriptive error for an unknown field', async () => {
    await expect(parseAQL('QUERY company { data { nope } }', makeSchemas())).rejects.toThrow(
      /No field "nope" is defined on schema "company"/
    );
  });

  test('throws when selecting {} on a non-relationship field', async () => {
    await expect(parseAQL('QUERY company { data { name { nope } } }', makeSchemas())).rejects.toThrow(
      /is not a relationship and cannot have a nested selection/
    );
  });

  test('throws on an unterminated string literal', async () => {
    await expect(parseAQL('QUERY company { filter { label = "unterminated } }', makeSchemas())).rejects.toThrow(
      /Unterminated string literal/
    );
  });

  test('throws for an unregistered primary resource type', async () => {
    await expect(parseAQL('QUERY unknownType { data { name } }', makeSchemas())).rejects.toThrow(
      /No schema is registered for primary resource type "unknownType"/
    );
  });
});
