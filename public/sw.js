/* Network-only application: account pages and API responses are never cached. */
self.addEventListener("install", (event) =>
  event.waitUntil(self.skipWaiting()),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    event.request.mode !== "navigate" ||
    new URL(event.request.url).origin !== self.location.origin
  )
    return;
  event.respondWith(
    fetch(event.request, { cache: "no-store" }).catch(
      () =>
        new Response(
          `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>You're offline · ArzDesk</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#dfe4ec;color:#1b2340;font:16px system-ui,sans-serif}main{max-width:420px;margin:24px;padding:32px;border-radius:20px;background:#f6f8fc}h1{font-size:28px}p{line-height:1.7}a{display:inline-block;background:#5145d9;color:white;padding:12px 22px;border-radius:10px;text-decoration:none}</style></head><body><main><strong>ArzDesk</strong><h1>You're offline</h1><p>Reconnect to the internet to open your workspace and continue working.</p><a href="/start">Try again</a></main></body></html>`,
          {
            status: 200,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "no-store",
            },
          },
        ),
    ),
  );
});
