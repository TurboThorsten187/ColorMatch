import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";

export default defineConfig({
    // Relative asset paths so the build also works under https://<user>.github.io/ColorMatch/
    base: "./",
    plugins: [svelte()],
    // The browser tests in e2e/ run with Playwright
    test: { include: ["src/**/*.test.ts"] },
});
