import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

export default defineConfig({
    // Relative asset paths so the build also works under https://<user>.github.io/ColorMatch/
    base: "./",
    plugins: [svelte()],
});
