/**
 * Compiles `.aql` (Abstract Query Language) source text into the persisted-query
 * envelope described by the JSON:API `QUERY` extension (`q:id`/`q:type`/`q:search`).
 *
 * See `./README.md` for the language grammar and worked examples.
 */

export interface FieldSchema {
  type: string | null;
  name: string;
  kind: 'attribute' | 'resource' | 'collection' | 'derived' | 'object' | 'array';
  options?: Record<string, unknown>;
}
export type Schema = Map<string, FieldSchema>;
export type Schemas = Map<string, Schema>;

export type AQLValue = string | number | boolean | null;

export interface PersistedAQLQuery {
  'q:id': string;
  'q:type': string;
  'q:search': Record<string, unknown>;
  'q:defaults'?: Record<string, Record<string, AQLValue>>;
}

async function digestMessage(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------------------
// Lexer
// ---------------------------------------------------------------------------

type TokenType =
  | 'ident'
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'arg'
  | 'semi'
  | '{'
  | '}'
  | '('
  | ')'
  | ','
  | '='
  | 'eof';

interface Token {
  type: TokenType;
  value?: string | number | boolean;
  pos: number;
}

const IDENT_CHAR = /[A-Za-z0-9_.$-]/;
const NUMBER_LITERAL = /^-?\d+(\.\d+)?$/;

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = input.length;

  while (i < n) {
    const ch = input[i];

    if (ch === '#') {
      while (i < n && input[i] !== '\n') i++;
      continue;
    }

    if (ch === '\n' || ch === ';') {
      tokens.push({ type: 'semi', pos: i });
      i++;
      continue;
    }

    if (ch === ' ' || ch === '\t' || ch === '\r') {
      i++;
      continue;
    }

    if (ch === '{' || ch === '}' || ch === '(' || ch === ')' || ch === ',' || ch === '=') {
      tokens.push({ type: ch, pos: i });
      i++;
      continue;
    }

    if (ch === '"') {
      const start = i;
      i++;
      let value = '';
      while (i < n && input[i] !== '"') {
        if (input[i] === '\\' && i + 1 < n) {
          value += input[i + 1];
          i += 2;
          continue;
        }
        value += input[i];
        i++;
      }
      if (i >= n) {
        throw new Error(`Unterminated string literal starting at position ${start}`);
      }
      i++; // consume closing quote
      tokens.push({ type: 'string', value, pos: start });
      continue;
    }

    if (ch === '@') {
      const start = i;
      let j = i + 1;
      while (j < n && /[A-Za-z]/.test(input[j])) j++;
      const word = input.slice(start, j);
      if (word !== '@arg') {
        throw new Error(`Unknown directive "${word}" at position ${start}`);
      }
      tokens.push({ type: 'arg', pos: start });
      i = j;
      continue;
    }

    if (IDENT_CHAR.test(ch)) {
      const start = i;
      let j = i;
      while (j < n && IDENT_CHAR.test(input[j])) j++;
      const word = input.slice(start, j);
      i = j;

      if (word === 'true' || word === 'false') {
        tokens.push({ type: 'boolean', value: word === 'true', pos: start });
      } else if (word === 'null') {
        tokens.push({ type: 'null', pos: start });
      } else if (NUMBER_LITERAL.test(word)) {
        tokens.push({ type: 'number', value: Number(word), pos: start });
      } else {
        tokens.push({ type: 'ident', value: word, pos: start });
      }
      continue;
    }

    throw new Error(`Unexpected character ${JSON.stringify(ch)} at position ${i}`);
  }

  tokens.push({ type: 'eof', pos: n });
  return tokens;
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

class TokenStream {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  peek(offset = 0): Token {
    return this.tokens[Math.min(this.pos + offset, this.tokens.length - 1)];
  }

  next(): Token {
    const token = this.tokens[this.pos];
    if (this.pos < this.tokens.length - 1) this.pos++;
    return token;
  }

  skipSemis(): void {
    while (this.peek().type === 'semi') this.next();
  }

  expect(type: TokenType): Token {
    const token = this.next();
    if (token.type !== type) {
      throw new Error(`Expected "${type}" but found "${token.type}" at position ${token.pos}`);
    }
    return token;
  }

  expectIdent(value: string): Token {
    const token = this.expect('ident');
    if (token.value !== value) {
      throw new Error(`Expected "${value}" but found "${String(token.value)}" at position ${token.pos}`);
    }
    return token;
  }
}

interface DataContext {
  schema: Schema;
  typeName: string;
}

function parseValue(stream: TokenStream): AQLValue {
  const token = stream.next();
  switch (token.type) {
    case 'string':
      return token.value as string;
    case 'number':
      return token.value as number;
    case 'boolean':
      return token.value as boolean;
    case 'null':
      return null;
    default:
      throw new Error(`Expected a value but found "${token.type}" at position ${token.pos}`);
  }
}

function valueType(value: AQLValue): string {
  return value === null ? 'null' : typeof value;
}

function parseDataBody(
  stream: TokenStream,
  schemas: Schemas,
  ctx: DataContext,
  fields: Record<string, Set<string>>,
  includes: Set<string>,
  path: string[]
): void {
  while (true) {
    stream.skipSemis();
    if (stream.peek().type === '}') return;

    const nameToken = stream.expect('ident');
    const fieldName = nameToken.value as string;
    const field = ctx.schema.get(fieldName);
    if (!field) {
      throw new Error(`No field "${fieldName}" is defined on schema "${ctx.typeName}"`);
    }

    (fields[ctx.typeName] ??= new Set()).add(field.name);

    if (stream.peek().type === '{') {
      if (field.kind !== 'resource' && field.kind !== 'collection') {
        throw new Error(
          `Field "${field.name}" on schema "${ctx.typeName}" is not a relationship and cannot have a nested selection`
        );
      }
      if (!field.type) {
        throw new Error(`Field "${field.name}" on schema "${ctx.typeName}" has no related type to select fields from`);
      }
      const relatedSchema = schemas.get(field.type);
      if (!relatedSchema) {
        throw new Error(`No schema is registered for type "${field.type}"`);
      }
      stream.next(); // consume '{'
      const nextPath = [...path, field.name];
      includes.add(nextPath.join('.'));
      parseDataBody(stream, schemas, { schema: relatedSchema, typeName: field.type }, fields, includes, nextPath);
      stream.expect('}');
    }

    stream.skipSemis();
  }
}

interface FilterOrPageBody {
  values: Record<string, unknown>;
  defaults: Record<string, AQLValue>;
}

function parseFilterOrPageBody(stream: TokenStream): FilterOrPageBody {
  const values: Record<string, unknown> = {};
  const defaults: Record<string, AQLValue> = {};

  while (true) {
    stream.skipSemis();
    if (stream.peek().type === '}') return { values, defaults };

    if (stream.peek().type === 'arg') {
      stream.next(); // consume '@arg'
      let types: string[] | null = null;
      if (stream.peek().type === '(') {
        stream.next();
        types = [];
        while (true) {
          const t = stream.next();
          if (t.type === 'ident') types.push(t.value as string);
          else if (t.type === 'null') types.push('null');
          else throw new Error(`Expected a type name in @arg(...) but found "${t.type}" at position ${t.pos}`);
          if (stream.peek().type === ',') {
            stream.next();
            continue;
          }
          break;
        }
        stream.expect(')');
      }

      const nameToken = stream.expect('ident');
      stream.expect('=');
      const value = parseValue(stream);
      const name = nameToken.value as string;

      values[`$${name}`] = (types ?? [valueType(value)]).join(',');
      defaults[name] = value;
    } else {
      const nameToken = stream.expect('ident');
      stream.expect('=');
      values[nameToken.value as string] = parseValue(stream);
    }

    stream.skipSemis();
  }
}

/**
 * Parses `.aql` source text into the JSON:API `QUERY` extension's persisted-query
 * envelope, resolving field/relationship references against `schemas`.
 */
export default async function parseAQL(aql: string, schemas: Schemas): Promise<PersistedAQLQuery> {
  if (!aql) {
    throw new Error('You must provide a query to parse');
  }

  const stream = new TokenStream(tokenize(aql));
  stream.skipSemis();
  stream.expectIdent('QUERY');

  const primaryTypeToken = stream.expect('ident');
  const primaryType = primaryTypeToken.value as string;
  const primarySchema = schemas.get(primaryType);
  if (!primarySchema) {
    throw new Error(`No schema is registered for primary resource type "${primaryType}"`);
  }

  stream.expect('{');

  const fields: Record<string, Set<string>> = {};
  const includes = new Set<string>();
  const query: Record<string, unknown> = {};
  const queryDefaults: Record<string, Record<string, AQLValue>> = {};

  stream.skipSemis();
  while (stream.peek().type !== '}') {
    const sectionToken = stream.expect('ident');
    const section = sectionToken.value as string;
    stream.expect('{');

    if (section === 'data') {
      parseDataBody(stream, schemas, { schema: primarySchema, typeName: primaryType }, fields, includes, []);
    } else if (section === 'filter' || section === 'page') {
      const { values, defaults } = parseFilterOrPageBody(stream);
      if (Object.keys(values).length) query[section] = values;
      if (Object.keys(defaults).length) queryDefaults[section] = defaults;
    } else {
      throw new Error(`Unknown query section "${section}" at position ${sectionToken.pos}`);
    }

    stream.expect('}');
    stream.skipSemis();
  }
  stream.expect('}');
  stream.skipSemis();
  stream.expect('eof');

  if (Object.keys(fields).length) {
    const queryFields: Record<string, string | string[]> = {};
    for (const [type, set] of Object.entries(fields)) {
      const names = Array.from(set);
      if (names.length) queryFields[type] = names.length > 1 ? names : names[0];
    }
    query.fields = queryFields;
  }
  if (includes.size) {
    const includeList = Array.from(includes);
    query.include = includeList.length > 1 ? includeList : includeList[0];
  }

  const id = await digestMessage(aql);
  const persisted: PersistedAQLQuery = {
    'q:id': id,
    'q:type': primaryType,
    'q:search': query,
  };
  if (Object.keys(queryDefaults).length) {
    persisted['q:defaults'] = queryDefaults;
  }
  return persisted;
}
