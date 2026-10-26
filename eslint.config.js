import js from "@eslint/js";
import prettier from "eslint-config-prettier/flat";
import svelte from "eslint-plugin-svelte";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import ts from "typescript-eslint";

// Imports go one way: ui -> app -> core, with platform (the browser) beside app. core runs the game with the modifier
// groups of src/modifiers, whose definitions take only types from core, so nothing depends on itself when the game
// loads. Across folders imports start at src/ (`@/core/game.ts`), so a file's layer shows in every import.
const ACROSS_FOLDERS = { regex: "^\\.\\./", message: "Import across folders from @/, e.g. @/core/game.ts" };

function layer(...patterns) {
    return { "no-restricted-imports": ["error", { patterns: [ACROSS_FOLDERS, ...patterns] }] };
}

export default defineConfig(
    globalIgnores(["dist/", "dist-e2e/", "dist-store/", "playwright-report/", "test-results/", "android/"]),
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
    { files: ["src/**"], rules: layer() },
    {
        files: ["src/core/**"],
        rules: layer(
            { regex: "^@/(?!modifiers/)", message: "core is pure game logic: it imports only from core and modifiers" },
            { regex: "^svelte", message: "core is pure game logic: no Svelte" },
        ),
    },
    {
        files: ["src/modifiers/**"],
        rules: {
            ...layer(
                { regex: "^@/(app|ui|platform)/", message: "modifiers are pure game logic like core" },
                { regex: "^svelte", message: "modifiers are pure game logic: no Svelte" },
            ),
            "@typescript-eslint/no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            regex: "^@/core/(?!colors\\.ts$|random\\.ts$)",
                            allowTypeImports: true,
                            message: "core imports the modifiers, so they take only types from it (and colors, random)",
                        },
                    ],
                },
            ],
        },
    },
    {
        files: ["src/platform/**"],
        rules: layer({ regex: "^@/(app|ui)/", message: "platform wraps the browser and knows nothing of app or ui" }),
    },
    {
        files: ["src/app/**"],
        rules: layer({ regex: "^@/ui/", message: "app drives the game and knows nothing of ui" }),
    },
    {
        files: ["e2e/**/*.ts", "playwright.config.ts", "scripts/**"],
        languageOptions: { globals: globals.node },
    },
);
