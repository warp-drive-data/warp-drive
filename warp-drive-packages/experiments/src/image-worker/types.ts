// oxlint-disable-next-line no-unused-vars
import type { ImageFetch } from './fetch';
// oxlint-disable-next-line no-unused-vars
import type { ImageWorker } from './worker';

/**
 * Sent by the {@link ImageWorker} once an image has finished loading.
 *
 * `objectUrl` is the url created via `URL.createObjectURL` for the fetched
 * image's blob; {@link ImageFetch} resolves the pending `load` request with
 * it.
 */
export type SuccessResponseEventData = {
  type: 'success-response';
  thread: string;
  url: string;
  objectUrl: string;
};
/**
 * Reserved for future use — the {@link ImageWorker} does not currently
 * send this message. A failed image fetch instead leaves the requesting
 * thread's `load` request pending indefinitely.
 */
export type ErrorResponseEventData = {
  type: 'error-response';
  thread: string;
  url: string;
};

/** Sent by {@link ImageFetch} to request that an image url be loaded. */
export type RequestEventData = {
  type: 'load';
  thread: string;
  url: string;
};

/** Sent to register a thread's {@link MessagePort} with the {@link ImageWorker}. */
export type ThreadInitEventData = {
  type: 'connect';
  thread: string;
};

export type MainThreadEvent = MessageEvent<SuccessResponseEventData | ErrorResponseEventData>;
export type WorkerThreadEvent = MessageEvent<RequestEventData> | MessageEvent<ThreadInitEventData>;
