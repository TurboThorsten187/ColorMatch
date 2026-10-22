import js from "@eslint/js";
import prettier from "eslint-config-prettier/flat";
import svelte from "eslint-plugin-svelte";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import ts from "typescript-eslint";

export default defineConfig(
    globalIgnores(["dist/", "dist-e2e/", "playwright-report/", "test-results/"]),
    js.configs.recommended,
    ts.configs.recommended,
    svelte.configs.recommended,
    prettier,
    svelte.configs.prettier,
    {
        languageOptions: {
            // Keep this consistent for TypeScript and Svelte files to avoid project reloads
            parserOptions: { extraFileExtensions: [".svelte"] },
            globals: globals.browser,
        },
    },
    {
        files: ["**/*.svelte", "**/*.svelte.ts"],
        languageOptions: {
            parserOptions: { projectService: true, parser: ts.parser },
        },
    },
    {
        files: ["e2e/**/*.ts", "playwright.config.ts"],
        languageOptions: { globals: globals.node },
    },
);
