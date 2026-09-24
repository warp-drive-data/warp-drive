import { toast } from '#app/helpers/toast.ts';

export function reportError(error: unknown, options?: { toast: boolean }) {
  const e = error instanceof Error ? error : new Error('An unknown error occurred', { cause: error });

  // oxlint-disable-next-line no-console -- reporting the error is this helper's job
  console.error(e);

  if (options?.toast) {
    toast('error', e.message);
  }
}
