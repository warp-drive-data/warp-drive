export class AdapterError extends Error {
  isAdapterError = true;
  errors: Array<{ title: string; detail: string }>;

  constructor(errors?: Array<{ title: string; detail: string }>, message = 'Adapter operation failed') {
    super(message);
    this.errors = errors ?? [{ title: 'Adapter Error', detail: message }];
  }
}

export class InvalidError extends AdapterError {
  isInvalidError = true;
}
