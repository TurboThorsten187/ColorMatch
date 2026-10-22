import { expect, test } from "@playwright/test";
import { button, openGame, startFirstGame } from "./helpers.ts";

// The service worker (src/sw.ts) caches every file of the build when it installs

test("plays offline after the first visit, with every font", async ({ page, context }) => {
    await openGame(page);
    await page.evaluate(() => navigator.serviceWorker.ready);

    await context.setOffline(true);
    await page.reload();

    await expect(button(page, "START GAME")).toBeFocused();
    const fonts = await page.evaluate(async () => {
        const faces = [...document.fonts];
        await Promise.allSettled(faces.map((face) => face.load()));
        return { all: faces.length, loaded: faces.filter((face) => face.status === "loaded").length };
    });
    expect(fonts.all).toBeGreaterThanOrEqual(28);
    expect(fonts.loaded).toBe(fonts.all);
    await startFirstGame(page);
});
