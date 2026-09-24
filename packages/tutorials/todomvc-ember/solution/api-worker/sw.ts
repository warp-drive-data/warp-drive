import { API_ROOT, CLAIM_MESSAGE } from './contract.ts';
import { cacheDb } from './db.ts';
import { createRouter } from './router.ts';

declare const self: ServiceWorkerGlobalScope;

const router = createRouter(cacheDb());

self.addEventListener('install', () => {
  void self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// A hard reload bypasses the worker, leaving the page uncontrolled even though
// the worker is already active. The page asks to be claimed; see register.ts.
self.addEventListener('message', (event) => {
  if (event.data === CLAIM_MESSAGE) event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname !== API_ROOT && !url.pathname.startsWith(`${API_ROOT}/`)) return;
  event.respondWith(router(event.request));
});
