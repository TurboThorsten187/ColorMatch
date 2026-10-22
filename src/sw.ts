/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core";
import { cleanupOutdatedCaches, matchPrecache, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";

// Offline support for the installed game, built by vite-plugin-pwa (vite.config.ts): the build lists every file of
// this version, and the worker caches all of them when it installs, the FONT FLIP fonts too. Files come from that
// cache. The page comes from the network while online, so a new version shows at once; offline it is the cached one,
// which always fits the cached files. A new version's worker takes over as soon as it has cached its files.

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Parameters<typeof precacheAndRoute>[0] };

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

registerRoute(
    new NavigationRoute(async ({ request }) => {
        try {
            return await fetch(request);
        } catch {
            return (await matchPrecache("index.html")) ?? Response.error();
        }
    }),
);

// The cache of the hand-written worker before this one
self.addEventListener("activate", (event) => event.waitUntil(caches.delete("colormatch")));

void self.skipWaiting();
clientsClaim();
