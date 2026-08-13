import { assert } from '@warp-drive/core/build-config/macros';
import type { Context, Future, Handler, NextFn } from '@warp-drive/core/request';
import type { ImmutableRequestInfo } from '@warp-drive/core/types/request';
import { streamFrames } from '@warp-drive/utilities/streaming';

type ContentType = 'ndjson' | (string & {});

/**
 * Describes how {@link StreamingFetch} should turn a streamed response's
 * raw text into a sequence of chunks.
 *
 * @public
 */
export interface Parser {
  /**
   * The delimiter {@link StreamingFetch} splits incoming text on as it
   * arrives. Defaults to `'\n'`.
   */
  frameDelimiter?: string;
  /**
   * Parses a piece of response text.
   *
   * Called once per frame with `isFull: false` as the response downloads;
   * returning `undefined` skips dispatching that frame to `onChunk`.
   * Called exactly once more with `isFull: true` and the complete
   * accumulated response text, to produce the value the request resolves
   * with.
   */
  parse: (chunk: string, isFull: boolean) => unknown;
}

/**
 * Configuration for a {@link StreamingFetch} instance.
 *
 * @public
 */
export interface StreamingFetchConfig {
  /**
   * Selects which {@link Parser} to use, when neither
   * {@link ImmutableRequestInfo.options | options.parser} nor
   * `options.parserType` is set on the request. Defaults to `'ndjson'`.
   */
  parserType?(request: Context['request'], response: Response): ContentType;
  /**
   * The {@link Parser}s available to select via
   * {@link StreamingFetchConfig.parserType | parserType} or
   * `options.parserType`.
   */
  parsers?: Record<ContentType, Parser>;
}

const PARSER = 'parser';
const PARSER_TYPE = 'parserType';
const CHUNK_HANDLER = 'onChunk';

const DEFAULT_NDJSON_PARSER: Parser = {
  parse: (chunk: string, isFull: boolean) => {
    if (!isFull) {
      return JSON.parse(chunk) as unknown;
    }
    return chunk
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as unknown);
  },
};

const DEFAULT_PARSERS: Record<ContentType, Parser> = {
  ndjson: DEFAULT_NDJSON_PARSER,
};

function getParser(req: ImmutableRequestInfo, response: Response, config: StreamingFetchConfig | null): Parser {
  const maybeParser = req.options?.[PARSER];
  if (maybeParser) {
    return maybeParser as Parser;
  }

  const parserType = (req.options?.[PARSER_TYPE] as ContentType) ?? config?.parserType?.(req, response) ?? 'ndjson';
  const parser = config?.parsers?.[parserType] ?? DEFAULT_PARSERS[parserType];
  assert(`StreamingFetch: no parser is configured for the content-type "${parserType}"`, parser);
  return parser;
}

/**
 * ***Experimental.*** An opt-in companion to {@link Fetch}: when a request
 * sets {@link ImmutableRequestInfo.options | options.onChunk}, `StreamingFetch`
 * issues the request itself and calls `onChunk` once per frame - via
 * `parser.parse(frame, false)` - as the response downloads, resolving with
 * `parser.parse(text, true)` once the response finishes.
 *
 * Requests that don't set `options.onChunk` are passed unchanged to the
 * next handler (typically {@link Fetch}), so `StreamingFetch` should be
 * registered before it:
 *
 * ```ts
 * import { Store, RequestManager, Fetch } from '@warp-drive/core';
 * import { StreamingFetch } from '@warp-drive/experiments/streaming-fetch';
 *
 * class AppStore extends Store {
 *   requestManager = new RequestManager()
 *     .use([new StreamingFetch(), Fetch]);
 * }
 * ```
 *
 * Unlike {@link Fetch}, `StreamingFetch` does not attempt Mirage detection,
 * FastBoot fallback, or the same breadth of network-error normalization -
 * it is intentionally narrower in scope while this capability is being
 * proven out.
 *
 * @public
 */
export class StreamingFetch implements Handler {
  declare config: StreamingFetchConfig | null;

  constructor(config?: StreamingFetchConfig) {
    this.config = config ?? null;
  }

  request<T>(context: Context, next: NextFn<T>): Promise<T> | Future<T> {
    const onChunk = context.request.options?.[CHUNK_HANDLER] as
      | ((chunk: unknown, context: Context) => void)
      | undefined;

    if (!onChunk) {
      return next(context.request);
    }

    return makeStreamingRequest<T>(context, onChunk, this.config);
  }
}

async function makeStreamingRequest<T>(
  context: Context,
  onChunk: (chunk: unknown, context: Context) => void,
  config: StreamingFetchConfig | null
): Promise<T> {
  assert(
    'StreamingFetch expects the request to have a URL, none was provided.',
    context.request.url && typeof context.request.url === 'string'
  );

  const response = await fetch(context.request.url, context.request);
  context.setResponse(response);

  const parser = getParser(context.request, response, config);
  const frameDelimiter = parser.frameDelimiter ?? '\n';

  if (!response.ok) {
    const text = await response.text();
    const error = new Error(
      `[${response.status} ${response.statusText}] ${context.request.method ?? 'GET'} - ${response.url}`
    ) as Error & { status: number; statusText: string; content: string };
    error.status = response.status;
    error.statusText = response.statusText;
    error.content = text;
    throw error;
  }

  assert('StreamingFetch expects the response to have a body.', response.body);

  // clone before the body is locked by `streamFrames`'s reader below, so we
  // can independently read the complete, untouched text for the final parse
  const textPromise = response.clone().text();

  for await (const frame of streamFrames(response.body, frameDelimiter)) {
    const parsed = parser.parse(frame, false);
    if (parsed !== undefined) {
      onChunk(parsed, context);
    }
  }

  const text = await textPromise;
  return parser.parse(text, true) as T;
}

/**
 * Types the `chunk` parameter of an {@link ImmutableRequestInfo.options | options.onChunk}
 * handler used with {@link StreamingFetch}. Present only at the type level;
 * at runtime this returns `handler` unchanged.
 *
 * @example
 * ```ts
 * import { withChunkHandler } from '@warp-drive/experiments/streaming-fetch';
 * import type { Message } from '#/data/types';
 *
 * store.request({
 *   url: '/api/assistant/stream',
 *   options: {
 *     onChunk: withChunkHandler<Message>((message, context) => {
 *       // message is typed as Message
 *     }),
 *   },
 * });
 * ```
 *
 * @public
 */
export function withChunkHandler<T>(
  handler: (chunk: T, context: Context) => void
): (chunk: unknown, context: Context) => void {
  return handler as (chunk: unknown, context: Context) => void;
}
