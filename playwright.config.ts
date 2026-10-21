import { defineConfig, devices } from "@playwright/test";

// Browser tests (e2e/) against a production build in the e2e mode, which takes a fixed random seed from the URL
// (src/testRng.ts). CHROMIUM_PATH points to an installed Chromium instead of the one `npx playwright install` loads.
const PORT = 4174;

export default defineConfig({
    testDir: "e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    // A test that fails now and then has a bug to find, a retry would only hide it
    retries: 0,
    reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
    use: {
        baseURL: `http://localhost:${PORT}`,
        launchOptions: { executablePath: process.env.CHROMIUM_PATH || undefined },
        trace: "retain-on-failure",
    },
    projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
    webServer: {
        command: `npm run build:e2e && npx vite preview --outDir dist-e2e --port ${PORT} --strictPort`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
