import { svelte } from "@sveltejs/vite-plugin-svelte";
import type { Preset } from "@vite-pwa/assets-generator/config";
import { fileURLToPath } from "node:url";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

// The app icons, rendered from public/favicon.svg on every build. The picture is a black square with the colors in
// its central 80 %, so it serves as a maskable icon as it is, without padding.
const ICONS: Preset = {
    transparent: { sizes: [192, 512], padding: 0, favicons: [[48, "favicon.ico"]] },
    maskable: { sizes: [512], padding: 0 },
    apple: { sizes: [180], padding: 0 },
    // Lossless, the faint scanlines would vanish otherwise
    png: { compressionLevel: 9, quality: 100 },
};

export default defineConfig({
    // Relative asset paths so the build also works under https://<user>.github.io/ColorMatch/
    base: "./",
    plugins: [
        svelte(),
        // Installable and offline: the web app manifest, the icons and the service worker src/sw.ts, which caches every
        // file of the build. main.ts registers it.
        VitePWA({
            strategies: "injectManifest",
            srcDir: "src",
            filename: "sw.ts",
            injectRegister: false,
            injectManifest: {
                // Fonts come as woff2 and woff, every browser that runs the game takes woff2
                globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
            },
            pwaAssets: { image: "public/favicon.svg", preset: ICONS, overrideManifestIcons: true },
            manifest: {
                id: "./",
                name: "ColorMatch",
                short_name: "ColorMatch",
                description: "Reaktionsspiel: Passt das Wort zu seiner Farbe?",
                lang: "de",
                start_url: "./",
                scope: "./",
                display: "fullscreen",
                orientation: "any",
                background_color: "#000000",
                theme_color: "#000000",
            },
        }),
    ],
    // Imports across folders start at src/: `@/core/game.ts`
    resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
    // The browser tests in e2e/ run with Playwright
    test: { include: ["src/**/*.test.ts"] },
});
