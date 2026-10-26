/* Only the public offline shell and build assets are cached. Never account/API responses. */
importScripts("/offline-assets.js");
const build = self.ARZDESK_OFFLINE_BUILD;
const cacheName = `arzdesk-shell-${build.version}`;
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(cacheName);
      try {
        // Separate fetches keep authenticated cookies out of the offline document.
        await Promise.all(
          build.assets.map(async (path) => {
            const response = await fetch(path, {
              credentials: "omit",
              cache: "reload",
            });
            if (!response.ok)
              throw new Error(`Offline asset unavailable: ${path}`);
            await cache.put(path, response);
          }),
        );
        await cache.put("/offline-ready", new Response(build.version));
        await self.skipWaiting();
      } catch (error) {
        await caches.delete(cacheName);
        throw error;
      }
    })(),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Keep the previous build too, so already-open tabs retain their lazy chunks.
      const previous = (await caches.keys()).filter(
        (key) => key.startsWith("arzdesk-shell-") && key !== cacheName,
      );
      await Promise.all(previous.slice(0, -1).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin)
    return;
  if (url.pathname === "/offline" && event.request.mode === "navigate") {
    // Online: request the latest public shell instead of displaying a weeks-old
    // cached page. Offline: use the last fully installed shell, preserving
    // IndexedDB and all workspace records.
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(event.request, { cache: "no-store" });
          if (fresh.ok) return fresh;
        } catch {
          // No connection: cached shell below.
        }
        const cached = await (await caches.open(cacheName)).match("/offline");
        return cached || Response.error();
      })(),
    );
    return;
  }
  if (build.assets.includes(url.pathname) && url.pathname !== "/offline") {
    event.respondWith(
      (async () =>
        (await caches.match(url.pathname)) || fetch(event.request))(),
    );
    return;
  }
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request, { cache: "no-store" }).catch(() =>
        Response.redirect(new URL("/offline", self.location.origin).href),
      ),
    );
  }
});
