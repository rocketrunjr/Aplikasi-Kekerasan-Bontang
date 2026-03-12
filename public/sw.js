const CACHE_NAME = "sisaka-v1";
const OFFLINE_URL = "/offline.html";

const STATIC_ASSETS = [
    "/",
    "/offline.html",
    "/manifest.json",
    "/favicon.ico",
];

// Install: cache static assets
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch: network-first for API, cache-first for static
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== "GET") return;

    // API routes: network-first
    if (url.pathname.startsWith("/api/")) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Clone and cache successful API responses
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, clone);
                        });
                    }
                    return response;
                })
                .catch(async () => {
                    // Try cache if network fails
                    const cached = await caches.match(request);
                    if (cached) return cached;
                    return new Response(
                        JSON.stringify({ error: "Offline" }),
                        {
                            status: 503,
                            headers: { "Content-Type": "application/json" },
                        }
                    );
                })
        );
        return;
    }

    // Navigation requests: network-first with offline fallback
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .catch(async () => {
                    const cached = await caches.match(request);
                    if (cached) return cached;
                    return caches.match(OFFLINE_URL);
                })
        );
        return;
    }

    // Static assets: cache-first
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;
            return fetch(request).then((response) => {
                // Cache static assets
                if (response.ok && (
                    url.pathname.endsWith(".js") ||
                    url.pathname.endsWith(".css") ||
                    url.pathname.endsWith(".png") ||
                    url.pathname.endsWith(".svg") ||
                    url.pathname.endsWith(".woff2")
                )) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, clone);
                    });
                }
                return response;
            });
        })
    );
});

// Background sync for offline report submissions
self.addEventListener("sync", (event) => {
    if (event.tag === "sync-reports") {
        event.waitUntil(syncOfflineReports());
    }
});

async function syncOfflineReports() {
    // In production: read from IndexedDB and POST to /api/reports
    console.log("[SW] Syncing offline reports...");
}
