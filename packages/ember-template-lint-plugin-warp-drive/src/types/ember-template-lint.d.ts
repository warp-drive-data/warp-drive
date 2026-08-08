/**
 * `ember-template-lint` (as of v7.9.x) does not ship its own TypeScript
 * declarations for the public plugin-authoring API described in
 * https://github.com/ember-template-lint/ember-template-lint/blob/master/docs/plugins.md
 *
 * This file declares just enough of that surface area (the `Rule` base
 * class and the `generateRuleTests` test harness) for us to author and
 * test our rule with type-safety. It intentionally does not attempt to
 * model the entire package.
 *
 * @internal
 */
declare module 'ember-template-lint' {
  import type { AST } from '@glimmer/syntax';

  export interface LogOptions {
    message: string;
    node?: AST.Node;
    line?: number;
    column?: number;
    endLine?: number;
    endColumn?: number;
    source?: string;
    isFixable?: boolean;
  }

  export type VisitorHandler<N> = (node: N) => void;

  export interface EnterExitVisitor<N> {
    enter?: VisitorHandler<N>;
    exit?: VisitorHandler<N>;
  }

  export type VisitorEntry<N> = VisitorHandler<N> | EnterExitVisitor<N>;

  export interface ElementNodeVisitorEntry extends EnterExitVisitor<AST.ElementNode> {
    keys?: {
      children?: EnterExitVisitor<AST.ElementNode>;
      comments?: EnterExitVisitor<AST.ElementNode>;
    };
  }

  export interface TemplateVisitor {
    Template?: VisitorEntry<AST.Template>;
    Block?: VisitorEntry<AST.Block>;
    ElementNode?: VisitorHandler<AST.ElementNode> | ElementNodeVisitorEntry;
    BlockStatement?: VisitorEntry<AST.BlockStatement>;
    MustacheStatement?: VisitorEntry<AST.MustacheStatement>;
    SubExpression?: VisitorEntry<AST.SubExpression>;
    PathExpression?: VisitorEntry<AST.PathExpression>;
    CommentStatement?: VisitorEntry<AST.CommentStatement>;
    MustacheCommentStatement?: VisitorEntry<AST.MustacheCommentStatement>;
    ElementModifierStatement?: VisitorEntry<AST.ElementModifierStatement>;
    AttrNode?: VisitorEntry<AST.AttrNode>;
    TextNode?: VisitorEntry<AST.TextNode>;
  }

  export class Rule {
    ruleName: string;
    config: unknown;
    mode: 'fix' | 'report';
    log(options: LogOptions): void;
    sourceForNode(node: AST.Node): string | undefined;
    isLocal(node: AST.Node): boolean;
    parseConfig(config: unknown): unknown;
    visitor(): TemplateVisitor | Promise<TemplateVisitor>;
  }

  export interface RuleTestCaseGood {
    name?: string;
    template: string;
    config?: unknown;
    meta?: Record<string, unknown>;
  }

  export interface RuleTestResult {
    message: string;
    line?: number;
    column?: number;
    endLine?: number;
    endColumn?: number;
    source?: string;
    isFixable?: boolean;
    filePath?: string;
    rule?: string;
    severity?: number;
  }

  export interface RuleTestCaseBad {
    name?: string;
    template: string;
    config?: unknown;
    meta?: Record<string, unknown>;
    result?: RuleTestResult;
    results?: RuleTestResult[];
    fixedTemplate?: string;
    verifyResults?: (results: RuleTestResult[]) => void;
  }

  export interface GenerateRuleTestsOptions {
    name: string;
    groupMethodBefore: (fn: () => void) => void;
    groupingMethod: (name: string, fn: () => void) => void;
    testMethod: (name: string, fn: () => void | Promise<void>) => void;
    plugins: unknown[];
    config?: unknown;
    good?: Array<string | RuleTestCaseGood>;
    bad?: RuleTestCaseBad[];
    error?: unknown[];
  }

  export function generateRuleTests(options: GenerateRuleTestsOptions): void;

  export const ASTHelpers: unknown;
  export const NodeMatcher: unknown;
  const defaultExport: unknown;
  export default defaultExport;
}
