/**
  A base class for the errors an adapter raises.

  @class AdapterError
  @public
*/
function AdapterError(errors, message = 'Adapter operation failed') {
  this.isAdapterError = true;
  this.errors = errors || [{ title: 'Adapter Error', detail: message }];
}

export default AdapterError;

/**
  Converts an array of JSON:API errors into an object keyed by attribute.

  ```javascript
  import { errorsArrayToHash } from '@ember-data/adapter/error';

  errorsArrayToHash([{ source: { pointer: '/data/attributes/name' }, detail: 'is invalid' }]);
  // => { name: ['is invalid'] }
  ```

  @method errorsArrayToHash
  @deprecated use the errors of the request instead
  @public
*/
export function errorsArrayToHash(errors) {
  const out = {};
  for (const error of errors) {
    const key = error.source.pointer.split('/').at(-1);
    (out[key] ??= []).push(error.detail);
  }
  return out;
}
