import { expect, test } from "@playwright/test";
import { button, keyFor, levelLabel, openGame, opposite, rightAnswer } from "./helpers.ts";

test.beforeEach(async ({ page }) => {
    await openGame(page);
});

test("explains the game, repeats a wrong practice word and then starts the game", async ({ page }) => {
    await button(page, "START GAME").click();

    for (let card = 1; card <= 3; card++) {
        await expect(page.getByText("HOW TO PLAY")).toBeVisible();
        await expect(page.getByText(`${card}/3`, { exact: true })).toBeVisible();
        await expect(button(page, "TRY IT ►")).toBeFocused();
        await page.keyboard.press("Enter");

        const practices = card === 3 ? [3, 4] : [card];
        for (const practice of practices) {
            await expect(page.getByText(`TRY IT · ${practice}/4`)).toBeVisible();
            if (practice === 2) {
                await page.keyboard.press(keyFor(opposite(await rightAnswer(page))));
                await expect(page.getByText("MISS!")).toBeVisible();
                // The same word comes again
                await expect(page.getByText("THEY DON'T MATCH")).toBeVisible();
                await expect(page.getByText("TRY IT · 2/4")).toBeVisible();
            }
            await page.keyboard.press(keyFor(await rightAnswer(page)));
            await expect(page.getByText(`TRY IT · ${practice}/4`)).toBeHidden();
        }
    }

    await expect(levelLabel(page, 1)).toBeVisible();
});

test("runs only once, even after a reload", async ({ page }) => {
    await button(page, "START GAME").click();
    await expect(page.getByText("HOW TO PLAY")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(levelLabel(page, 1)).toBeVisible();

    await page.reload();
    await button(page, "START GAME").click();
    await expect(levelLabel(page, 1)).toBeVisible();
    await expect(page.getByText("HOW TO PLAY")).toBeHidden();
});

test("comes back with REPLAY in the settings", async ({ page }) => {
    await button(page, "SETTINGS").click();
    await button(page, "REPLAY").click();
    await expect(page.getByText("HOW TO PLAY")).toBeVisible();

    await button(page, "SKIP").click();
    await expect(levelLabel(page, 1)).toBeVisible();
});
