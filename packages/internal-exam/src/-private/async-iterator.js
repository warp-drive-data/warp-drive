const iteratorCompleteResponse = { done: true, value: null };

/**
 * Iterates a sequential set of asynchronous request/response events over a
 * testem socket (e.g. `testem:next-module-request` / `testem:next-module-response`).
 */
export default class AsyncIterator {
  constructor(testem, options) {
    this._testem = testem;
    this._request = options.request;
    this._response = options.response;
    this._done = false;
    this._current = null;
    this._boundHandleResponse = this.handleResponse.bind(this);
    this._waiting = false;
    // Set a timeout value from either url parameter or default timeout value, 15 s.
    this._timeout = options.timeout || 15;
    this._browserId = options.browserId;
    this._emberExamExitOnError = options.emberExamExitOnError;

    testem.on(this._response, this._boundHandleResponse);
  }

  get done() {
    return this._done;
  }

  toString() {
    return `<AsyncIterator (request: ${this._request} response: ${this._response})>`;
  }

  handleResponse(response) {
    if (this._waiting === false) {
      throw new Error(`${this.toString()} Was not expecting a response, but got a response`);
    } else {
      this._waiting = false;
    }

    try {
      if (response.done) {
        this.dispose();
      }
      this._current.resolve(response);
    } catch (e) {
      this._current.reject(e);
    } finally {
      this._current = null;

      if (this.timer) {
        clearTimeout(this.timer);
      }
    }
  }

  dispose() {
    this._done = true;
    this._testem.removeEventCallbacks(this._response, this._boundHandleResponse);
  }

  _makeNextRequest() {
    this._waiting = true;
    this._testem.emit(this._request, this._browserId);
  }

  _setTimeout(resolve, reject) {
    clearTimeout(this.timeout);
    this.timer = setTimeout(() => {
      if (!this._waiting) {
        return;
      }

      if (this._emberExamExitOnError) {
        const err = new Error(
          `Promise timed out after ${this._timeout} s while waiting for response for ${this._request}`
        );
        reject(err);
      } else {
        // eslint-disable-next-line no-console
        console.error(
          `Promise timed out after ${this._timeout} s while waiting for response for ${this._request}. Closing browser to exit gracefully.`
        );
        resolve(iteratorCompleteResponse);
      }
    }, this._timeout * 1000);
  }

  /**
   * Gets the next response, resolving `{done: true}` at end of iteration.
   *
   * @return {Promise<{done: boolean, value: string | null}>}
   */
  next() {
    if (this._done) {
      return Promise.resolve(iteratorCompleteResponse);
    }
    if (this._current) {
      return this._current.promise;
    }

    let resolve, reject;
    const promise = new Promise((_resolve, _reject) => {
      resolve = _resolve;
      reject = _reject;
      this._setTimeout(resolve, reject);
    });

    this._current = { resolve, reject, promise };

    this._makeNextRequest();

    return promise;
  }
}
