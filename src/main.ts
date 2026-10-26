import { mount } from "svelte";
import { loadFlipFonts, loadFonts } from "@/platform/fonts.ts";
import { listenForInstallOffer } from "@/platform/install.svelte.ts";
import { isNativeApp } from "@/platform/native.ts";
import App from "./App.svelte";
import "@/ui/kit/tokens.css";
import "./app.css";

const target = document.getElementById("app");
if (!target) {
    throw new Error("Mount point #app not found");
}

listenForInstallOffer();
await loadFonts();
// The modifier gallery, the achievement icons and the feature graphic for developers (src/ui/dev/), left out of
// production builds
const params = new URLSearchParams(window.location.search);
const dev = import.meta.env.MODE !== "production";
if (dev && params.has("gallery")) mount((await import("@/ui/dev/Gallery.svelte")).default, { target });
else if (dev && params.has("awardIcons")) mount((await import("@/ui/dev/AwardIcons.svelte")).default, { target });
else if (dev && params.has("featureGraphic"))
    mount((await import("@/ui/dev/FeatureGraphic.svelte")).default, { target });
else mount(App, { target });
// The FONT FLIP fonts, in the background
void loadFlipFonts();

// Offline support (src/sw.ts), only in web builds: the Android app has its files on the device
if (import.meta.env.PROD && !isNativeApp() && "serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch((error: unknown) => {
        console.error("Service worker registration failed", error);
    });
}
