const CACHE_NAME = "sisaka-v2";
const OFFLINE_URL = "/offline.html";

const STATIC_ASSETS = [
    "/offline.html",
    "/manifest.json",
    "/favicon.ico",
];

// Install: cache only essential offline assets
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate: clean up ALL old caches immediately
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

// Fetch: always network-first for everything
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== "GET") return;

    // API routes: network-only (never serve stale API data)
    if (url.pathname.startsWith("/api/")) {
        event.respondWith(
            fetch(request).catch(async () => {
                // Only fall back to cache if truly offline
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
            fetch(request).catch(async () => {
                const cached = await caches.match(request);
                if (cached) return cached;
                return caches.match(OFFLINE_URL);
            })
        );
        return;
    }

    // All other assets (JS, CSS, images): network-first
    // This ensures updated code is always fetched immediately
    event.respondWith(
        fetch(request)
            .then((response) => {
                // Only cache truly static assets (icons, fonts)
                if (response.ok && (
                    url.pathname.endsWith(".woff2") ||
                    url.pathname.endsWith(".ico") ||
                    url.pathname.startsWith("/icons/")
                )) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, clone);
                    });
                }
                return response;
            })
            .catch(async () => {
                // Offline: try serving from cache
                const cached = await caches.match(request);
                if (cached) return cached;
                return new Response("", { status: 504 });
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
