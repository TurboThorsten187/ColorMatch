import { svelte } from "@sveltejs/vite-plugin-svelte";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
    // Relative asset paths so the build also works under https://<user>.github.io/ColorMatch/
    base: "./",
    plugins: [svelte()],
    // Imports across folders start at src/: `@/core/game.ts`
    resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
    // The browser tests in e2e/ run with Playwright
    test: { include: ["src/**/*.test.ts"] },
});
