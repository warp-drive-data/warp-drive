// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ImageFetch } from './fetch';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ImageWorker } from './worker';

/**
 * Sent by the {@link ImageWorker} once an image has finished loading.
 *
 * @remarks
 * The worker also attaches an `objectUrl` for the fetched image's blob to
 * this message, but {@link ImageFetch} does not currently read it — the
 * `url` field is used to resolve the pending `load` request instead.
 */
export type SuccessResponseEventData = {
  type: 'success-response';
  thread: string;
  url: string;
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
