/**
 * Utilities for consuming streamed HTTP responses: decoding a byte stream
 * into structured chunks as they arrive, and folding those chunks into the
 * store's cache so subscribers see reactive, incremental updates instead of
 * waiting for the full response.
 *
 * @module
 */
export { streamFrames, streamJsonLines, type StreamJsonLinesOptions } from './-private/streaming/frames.ts';
export { streamIntoResource, type StreamIntoResourceOptions } from './-private/streaming/store-push.ts';
