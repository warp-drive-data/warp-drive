import type {
  ArgumentNode,
  DocumentNode,
  FragmentDefinitionNode,
  OperationDefinitionNode,
  SelectionSetNode,
  ValueNode,
  VariableDefinitionNode,
} from 'graphql';

import type { GraphqlVariables } from '@warp-drive/core/types/graphql-request';

import { stableStringify } from './utilities';

/**
 * What the query says about a field of the response: the name of the field (the response may use an
 * alias instead), its arguments, and what is selected below it.
 */
interface FieldInfo {
  name: string;
  args: readonly ArgumentNode[];
  selection: SelectionIndex | null;
}

/**
 * The fields selected at one level of a query, by the key they have in the response, with the
 * fragments already expanded.
 */
class SelectionIndex {
  declare fields: Map<string, FieldInfo>;
  /**
   * Whether this level, or any level below, has a field with arguments. When it does not, the
   * response below it does not need to be looked at.
   */
  hasArguments = false;

  constructor() {
    this.fields = new Map();
  }
}

interface DocumentIndex {
  operations: Map<string, SelectionIndex>;
  definitions: Map<string, readonly VariableDefinitionNode[]>;
}

const INDEXES = new WeakMap<DocumentNode, DocumentIndex>();

/**
 * Builds the key a field with arguments is stored under: its name plus its arguments, with the
 * keys sorted so the same arguments always give the same key. The alias a query gave the field
 * is not part of it, so every query that asks for the same field with the same arguments
 * reads and writes the same value.
 *
 * ```ts
 * fieldKey('memberList', { to: '2026-01-31', from: '2026-01-01' });
 * // => 'memberList({"from":"2026-01-01","to":"2026-01-31"})'
 * ```
 */
export function fieldKey(name: string, args: Record<string, unknown> = {}): string {
  return `${name}(${stableStringify(args)})`;
}

/**
 * Whether a key was built by {@link fieldKey}. A GraphQL field name cannot hold a `(`, so it is enough.
 */
export function isFieldKey(key: string): boolean {
  return key.endsWith(')') && key.includes('(');
}

function addSelections(
  index: SelectionIndex,
  selectionSet: SelectionSetNode,
  fragments: Map<string, FragmentDefinitionNode>,
  visiting: Set<string>
): void {
  for (const selection of selectionSet.selections) {
    if (selection.kind === 'Field') {
      const responseKey = selection.alias?.value ?? selection.name.value;
      let info = index.fields.get(responseKey);
      if (!info) {
        info = { name: selection.name.value, args: selection.arguments ?? [], selection: null };
        index.fields.set(responseKey, info);
      }
      if (info.args.length > 0) {
        index.hasArguments = true;
      }
      if (selection.selectionSet) {
        info.selection ??= new SelectionIndex();
        addSelections(info.selection, selection.selectionSet, fragments, visiting);
        if (info.selection.hasArguments) {
          index.hasArguments = true;
        }
      }
    } else if (selection.kind === 'InlineFragment') {
      // The type condition is not checked: the response only holds the fields that applied to its
      // object, and fields with the same response key must have the same arguments.
      addSelections(index, selection.selectionSet, fragments, visiting);
    } else {
      const name = selection.name.value;
      const fragment = fragments.get(name);
      if (fragment && !visiting.has(name)) {
        visiting.add(name);
        addSelections(index, fragment.selectionSet, fragments, visiting);
        visiting.delete(name);
      }
    }
  }
}

function indexFor(document: DocumentNode): DocumentIndex {
  let index = INDEXES.get(document);
  if (index) {
    return index;
  }

  const fragments = new Map<string, FragmentDefinitionNode>();
  const operations: OperationDefinitionNode[] = [];
  for (const definition of document.definitions) {
    if (definition.kind === 'FragmentDefinition') {
      fragments.set(definition.name.value, definition);
    } else if (definition.kind === 'OperationDefinition') {
      operations.push(definition);
    }
  }

  index = { operations: new Map(), definitions: new Map() };
  for (const operation of operations) {
    const selection = new SelectionIndex();
    addSelections(selection, operation.selectionSet, fragments, new Set());
    const name = operation.name?.value ?? '';
    index.operations.set(name, selection);
    index.definitions.set(name, operation.variableDefinitions ?? []);
  }

  INDEXES.set(document, index);
  return index;
}

function valueOf(
  node: ValueNode,
  variables: GraphqlVariables,
  definitions: readonly VariableDefinitionNode[]
): unknown {
  switch (node.kind) {
    case 'Variable': {
      const name = node.name.value;
      if (variables[name] !== undefined) {
        return variables[name];
      }
      const definition = definitions.find((d) => d.variable.name.value === name);
      return definition?.defaultValue ? valueOf(definition.defaultValue, variables, definitions) : undefined;
    }
    case 'IntValue':
    case 'FloatValue':
      return Number(node.value);
    case 'NullValue':
      return null;
    case 'ListValue':
      return node.values.map((value) => valueOf(value, variables, definitions));
    case 'ObjectValue': {
      const object: Record<string, unknown> = {};
      for (const field of node.fields) {
        object[field.name.value] = valueOf(field.value, variables, definitions);
      }
      return object;
    }
    default:
      // StringValue, BooleanValue and EnumValue
      return node.value;
  }
}

function resolveArguments(
  args: readonly ArgumentNode[],
  variables: GraphqlVariables,
  definitions: readonly VariableDefinitionNode[]
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  for (const arg of args) {
    const value = valueOf(arg.value, variables, definitions);
    // an argument that was not given a value (a variable that was not passed) is not part of the key
    if (value !== undefined) {
      resolved[arg.name.value] = value;
    }
  }
  return resolved;
}

function rewrite(
  value: unknown,
  index: SelectionIndex | null,
  variables: GraphqlVariables,
  definitions: readonly VariableDefinitionNode[]
): unknown {
  if (index === null || !index.hasArguments || value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item: unknown) => rewrite(item, index, variables, definitions));
  }

  const rewritten: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    const info = index.fields.get(key);
    const resolved = rewrite(child, info?.selection ?? null, variables, definitions);
    if (info && info.args.length > 0) {
      rewritten[fieldKey(info.name, resolveArguments(info.args, variables, definitions))] = resolved;
    } else {
      rewritten[key] = resolved;
    }
  }
  return rewritten;
}

/**
 * Renames, in the `data` of a GraphQL response, the fields that were asked for with arguments to
 * the key {@link fieldKey} builds, so the values of the same field for different arguments do not
 * overwrite each other. Fields without arguments, and the fields of the root of the operation,
 * keep the key they have in the response.
 *
 * Returns `data` itself when the query has no field with arguments below its root.
 */
export function applyFieldArguments(
  data: Record<string, unknown>,
  document: DocumentNode,
  operationName: string,
  variables: GraphqlVariables
): Record<string, unknown> {
  const index = indexFor(document);
  const [name, root] = index.operations.has(operationName)
    ? [operationName, index.operations.get(operationName)]
    : (index.operations.entries().next().value ?? [operationName, undefined]);
  if (!root?.hasArguments) {
    return data;
  }

  const definitions = index.definitions.get(name) ?? [];
  const rewritten: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    rewritten[key] = rewrite(value, root.fields.get(key)?.selection ?? null, variables, definitions);
  }
  return rewritten;
}
