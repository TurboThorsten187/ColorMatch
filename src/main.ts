import { mount } from "svelte";
import { loadFlipFonts, loadFonts } from "@/platform/fonts.ts";
import { listenForInstallOffer } from "@/platform/install.svelte.ts";
import App from "./App.svelte";
import "@/ui/kit/tokens.css";
import "./app.css";

const target = document.getElementById("app");
if (!target) {
    throw new Error("Mount point #app not found");
}

listenForInstallOffer();
await loadFonts();
mount(App, { target });
const flipFonts = loadFlipFonts();

// Offline support (public/sw.js): the worker keeps exactly the files this page loaded
if (import.meta.env.PROD && "serviceWorker" in navigator) {
    navigator.serviceWorker
        .register("./sw.js")
        .then(() => navigator.serviceWorker.ready)
        // The FONT FLIP fonts belong to the loaded files, so they are there offline too
        .then(async (registration) => {
            await flipFonts;
            const loaded = performance.getEntriesByType("resource").map((entry) => entry.name);
            registration.active?.postMessage({ loaded });
        })
        .catch((error: unknown) => {
            console.error("Service worker registration failed", error);
        });
}
