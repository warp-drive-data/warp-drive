import { CLAIM_MESSAGE } from './contract.ts';

/**
 * Registers the API worker and resolves once it controls this page.
 *
 * Until the worker controls the page, requests to /api go to the network and
 * fail. That is always true on the very first visit and after a hard reload,
 * so the app must await this before it boots.
 */
export async function startApiWorker(url = '/sw.js'): Promise<void> {
  const { serviceWorker } = navigator;

  const registration = await serviceWorker.register(url, { scope: '/' });
  await serviceWorker.ready;
  if (serviceWorker.controller) return;

  const controlled = new Promise<void>((resolve) => {
    serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
  });
  registration.active?.postMessage(CLAIM_MESSAGE);
  await controlled;
}
