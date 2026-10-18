// Offline support for the installed game. The page comes from the network while online, so a new version shows up
// at once; all other files are served from the cache. On every start the page reports the files it loaded (main.ts):
// that fills the cache on the very first visit and drops the files of older versions.

const CACHE = "colormatch";
const START_PAGE = new URL("./", self.location.href).href;

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(CACHE)
            .then((cache) => cache.add(START_PAGE))
            .then(() => self.skipWaiting()),
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
    const { request } = event;
    if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
    event.respondWith(request.mode === "navigate" ? pageFromNetwork(request) : fileFromCache(request));
});

self.addEventListener("message", (event) => {
    const urls = event.data?.loaded;
    if (!Array.isArray(urls) || !urls.every((url) => typeof url === "string")) return;
    event.waitUntil(keepOnly(urls));
});

async function pageFromNetwork(request) {
    const cache = await caches.open(CACHE);
    try {
        const response = await fetch(request);
        if (response.ok) await cache.put(START_PAGE, response.clone());
        return response;
    } catch {
        // Offline: the last page that loaded fine
        return (await cache.match(START_PAGE)) ?? Response.error();
    }
}

async function fileFromCache(request) {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
}

// The cache ends up holding exactly the start page and the files the current version loaded
async function keepOnly(urls) {
    const cache = await caches.open(CACHE);
    const keep = new Set([START_PAGE]);
    for (const url of urls) {
        const parsed = new URL(url, self.location.href);
        if (parsed.origin === self.location.origin) keep.add(parsed.href);
    }
    const cached = new Set();
    for (const request of await cache.keys()) {
        if (keep.has(request.url)) cached.add(request.url);
        else await cache.delete(request);
    }
    await cache.addAll([...keep].filter((url) => !cached.has(url)));
}
