import type { CacheOptions } from './request';
import type { RequestSignature } from './symbols';

export type GraphqlUrlOptions = {
  identifier: { type: string };
  operationName: string;
  op: 'query' | 'mutation';
};

export interface GraphqlQuery {
  url: string;
  method: string;
  headers: Headers;
  body: string;
}

export interface GraphqlVariables {
  first?: number;
  last?: number;
  before?: string;
  after?: string;
  [variable: string]: unknown;
}

export type GraphqlRequestOptions<RT = unknown> = {
  url: string;
  method: 'POST';
  headers: Headers;
  cacheOptions?: CacheOptions;
  op: 'query' | 'mutation';
  [RequestSignature]?: RT;
};

export type GraphqlQueryRequestOptions<RT = unknown> = {
  url: string;
  method: 'POST';
  headers: Headers;
  cacheOptions?: CacheOptions;
  op: 'query';
  [RequestSignature]?: RT;
  body: string;
};

export type GraphqlRequestBody = {
  query: string;
  operationName: string;
  variables: Record<string, unknown>;
};
