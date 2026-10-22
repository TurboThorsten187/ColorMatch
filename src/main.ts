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
// The modifier gallery for developers (src/ui/dev/Gallery.svelte), left out of production builds
const gallery = import.meta.env.MODE !== "production" && new URLSearchParams(window.location.search).has("gallery");
mount(gallery ? (await import("@/ui/dev/Gallery.svelte")).default : App, { target });
// The FONT FLIP fonts, in the background
void loadFlipFonts();

// Offline support (src/sw.ts), only in builds
if (import.meta.env.PROD && "serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch((error: unknown) => {
        console.error("Service worker registration failed", error);
    });
}
