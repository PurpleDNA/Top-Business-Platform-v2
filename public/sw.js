// Minimal service worker — its only job is to make the app installable.
// It passes every request straight through to the network (no offline caching).
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // No-op fetch handler. Required for the browser to treat the app as installable.
});
