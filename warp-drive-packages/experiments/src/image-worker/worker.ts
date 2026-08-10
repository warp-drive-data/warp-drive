// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ImageFetch } from './fetch';
import type { RequestEventData, ThreadInitEventData, WorkerThreadEvent } from './types';

const WorkerScope = (globalThis as unknown as { SharedWorkerGlobalScope: FunctionConstructor }).SharedWorkerGlobalScope;

async function loadImage(url: string): Promise<string> {
  const response = await fetch(url);
  const fileBlob = await response.blob();
  return URL.createObjectURL(fileBlob);
}

/**
 * Runs inside a `Worker` or `SharedWorker` to fetch images on behalf of
 * one or more {@link ImageFetch} instances running on the main thread(s)
 * that connect to it.
 *
 * Each connecting thread registers itself by sending a `connect` message
 * along with a {@link MessagePort}. When a thread sends a `load` request
 * for a url, the worker fetches the image via `fetch`, converts the
 * response into a `Blob`, and creates an object url for it via
 * `URL.createObjectURL`. The fetch for a given url is deduped and cached
 * in-memory for the lifetime of the worker, so repeat `load` requests for
 * the same url — whether from the same or a different connected thread —
 * do not trigger another network request.
 *
 * Only intended for use inside a Worker context: constructing an
 * `ImageWorker` on the main thread is a no-op.
 *
 * @public
 */
export class ImageWorker {
  declare private threads: Map<string, MessagePort>;
  declare private pendingImages: Map<string, Promise<string>>;
  declare private options: { persisted: boolean };
  declare private isSharedWorker: boolean;
  declare private cache: Map<string, string>;

  /**
   * @param options.persisted - reserved for a future on-disk cache; currently unused.
   */
  constructor(options?: { persisted: boolean }) {
    // disable if running on main thread
    if (typeof window !== 'undefined') {
      return;
    }
    this.threads = new Map();
    this.pendingImages = new Map();
    this.cache = new Map();
    this.options = options || { persisted: false };
    this.isSharedWorker = WorkerScope && globalThis instanceof WorkerScope;
    this.initialize();
  }

  private fetch(url: string): Promise<string> {
    const objectUrl = this.cache.get(url);

    if (objectUrl) {
      return Promise.resolve(objectUrl);
    }

    const pending = this.pendingImages.get(url);
    if (pending) {
      return pending;
    }

    const promise = loadImage(url).then((loadedObjectUrl) => {
      this.cache.set(url, loadedObjectUrl);
      return loadedObjectUrl;
    });
    this.pendingImages.set(url, promise);
    return promise.finally(() => {
      this.pendingImages.delete(url);
    });
  }

  private initialize(): void {
    if (this.isSharedWorker) {
      (globalThis as unknown as { onconnect: typeof globalThis.onmessage }).onconnect = (e) => {
        const port = e.ports[0];
        port.onmessage = (event: MessageEvent<ThreadInitEventData>) => {
          const { type } = event.data;

          switch (type) {
            case 'connect':
              this.setupThread(event.data.thread, port);
              break;
          }
        };
        port.start();
      };
    } else {
      globalThis.onmessage = (event: MessageEvent<ThreadInitEventData>) => {
        const { type } = event.data;

        switch (type) {
          case 'connect':
            this.setupThread(event.data.thread, event.ports[0]);
            break;
        }
      };
    }
  }

  private setupThread(thread: string, port: MessagePort): void {
    this.threads.set(thread, port);
    port.onmessage = (event: WorkerThreadEvent) => {
      if (event.type === 'close') {
        this.threads.delete(thread);
        return;
      }

      const { type } = event.data;
      switch (type) {
        case 'load':
          void this.request(event.data);
          break;
      }
    };
  }

  private async request(event: RequestEventData): Promise<void> {
    const { thread, url } = event;

    const objectUrl = await this.fetch(url);
    const port = this.threads.get(thread)!;
    port.postMessage({ type: 'success-response', thread, url, objectUrl });
  }
}
