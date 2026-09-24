import { CLAIM_MESSAGE } from './contract.ts';

const TIMEOUT_MS = 10_000;

/**
 * Registers the API worker and resolves once it controls this page.
 *
 * Until the worker controls the page, requests to /api go to the network and
 * fail. That is always true on the very first visit and after a hard reload,
 * so the app must await this before it boots.
 *
 * Rejects instead of hanging if the page can't use service workers or the
 * worker never takes control, so a broken setup fails with a message.
 */
export async function startApiWorker(url = '/sw.js'): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    throw new Error(
      'The TodoMVC API runs in a service worker, which this page cannot use. Open the app from localhost or over https.'
    );
  }
  const { serviceWorker } = navigator;

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`The API worker did not take control of this page within ${TIMEOUT_MS / 1000}s.`)),
      TIMEOUT_MS
    );
  });

  try {
    await Promise.race([claim(serviceWorker, url), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

async function claim(serviceWorker: ServiceWorkerContainer, url: string): Promise<void> {
  const registration = await serviceWorker.register(url, { scope: '/' });
  await serviceWorker.ready;
  if (serviceWorker.controller) return;

  const controlled = new Promise<void>((resolve) => {
    serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
  });
  registration.active?.postMessage(CLAIM_MESSAGE);
  await controlled;
}
