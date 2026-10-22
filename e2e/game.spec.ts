import { expect, test } from "@playwright/test";
import {
    button,
    CARD_INPUT_LOCK_MS,
    clearLevel,
    expectGameOver,
    leaveWindow,
    levelLabel,
    missLevel,
    openGame,
    readWord,
    rightAnswer,
    startFirstGame,
    statValue,
} from "./helpers.ts";

test.describe("a game", () => {
    test.beforeEach(async ({ page }) => {
        await openGame(page);
        await startFirstGame(page);
    });

    test("introduces the first modifier with a card on level 5", async ({ page }) => {
        for (let level = 1; level <= 4; level++) await clearLevel(page, level);

        await expect(page.getByText("NEW MODIFIER!")).toBeVisible();
        await expect(page.getByText("PAUSED", { exact: true })).toBeVisible();
        await expect(button(page, "GOT IT")).toBeFocused();
        await button(page, "GOT IT").click();

        await expect(page.getByText("NEW MODIFIER!")).toBeHidden();
        await expect(levelLabel(page, 5)).toBeVisible();
        await expect(page.getByText("PAUSED", { exact: true })).toBeHidden();
    });

    test("ends on a wrong answer and starts over with RETRY", async ({ page }) => {
        await clearLevel(page, 1);
        await clearLevel(page, 2);
        await missLevel(page);

        await expect(page.getByText("MISS!")).toBeVisible();
        await expect(button(page, "RETRY")).toBeHidden();
        await expectGameOver(page, 2);
        await expect(page.getByText("NEW HI-SCORE!")).toBeVisible();
        await expect(button(page, "RETRY")).toBeFocused();

        // The tutorial ran once, a new game starts right away
        await page.keyboard.press("Enter");
        await expect(levelLabel(page, 1)).toBeVisible();
        await expect(page.getByText("HOW TO PLAY")).toBeHidden();
    });

    test("ends when the time runs out", async ({ page }) => {
        await clearLevel(page, 1);

        await expect(page.getByText("TIME UP!")).toBeVisible({ timeout: 5_000 });
        await expectGameOver(page, 1);
    });

    test("goes back to the menu with Escape after game over", async ({ page }) => {
        await missLevel(page);
        await expectGameOver(page, 0);

        await page.keyboard.press("Escape");
        await expect(button(page, "START GAME")).toBeVisible();
    });

    test("pauses when the window is left and continues where it stopped", async ({ page }) => {
        await clearLevel(page, 1);
        await leaveWindow(page);

        await expect(page.getByRole("heading", { name: "PAUSED" })).toBeVisible();
        await expect(page.getByText("TAP TO CONTINUE")).toBeVisible();
        // Far longer than the level's time: a paused level does not run out
        await page.waitForTimeout(3_500);
        await page.keyboard.press("Enter");

        await expect(page.getByRole("heading", { name: "PAUSED" })).toBeHidden();
        await clearLevel(page, 2);
    });

    test("answers with a click on the left or right half of the screen", async ({ page }) => {
        const viewport = page.viewportSize();
        if (!viewport) throw new Error("The test needs a fixed viewport");
        await page.waitForTimeout(CARD_INPUT_LOCK_MS);
        for (let level = 1; level <= 3; level++) {
            await expect(levelLabel(page, level)).toBeVisible();
            const x = (await rightAnswer(page)) === "true" ? viewport.width * 0.25 : viewport.width * 0.75;
            await page.mouse.click(x, viewport.height / 2);
        }
        await expect(levelLabel(page, 4)).toBeVisible();
    });

    test("keeps the highscore and counts the game in the stats", async ({ page }) => {
        await clearLevel(page, 1);
        await clearLevel(page, 2);
        await clearLevel(page, 3);
        await missLevel(page);
        await expectGameOver(page, 3);

        await page.reload();
        await expect(page.getByText("000003", { exact: true })).toBeVisible();
        await button(page, "STATS").click();
        await expect(page.getByRole("heading", { name: "STATS" })).toBeVisible();
        await expect(statValue(page, "GAMES")).toHaveText("1");
        await expect(statValue(page, "HI-SCORE")).toHaveText("3");
    });
});

test.describe("on a touch screen", () => {
    test.use({ hasTouch: true, isMobile: true, viewport: { width: 412, height: 839 } });

    test("answers with a tap on the left or right half", async ({ page }) => {
        await openGame(page);
        await button(page, "START GAME").tap();
        await button(page, "SKIP").tap();
        await expect(levelLabel(page, 1)).toBeVisible();
        await page.waitForTimeout(CARD_INPUT_LOCK_MS);
        const viewport = page.viewportSize();
        if (!viewport) throw new Error("The test needs a fixed viewport");
        for (let level = 1; level <= 3; level++) {
            await expect(levelLabel(page, level)).toBeVisible();
            const x = (await rightAnswer(page)) === "true" ? viewport.width * 0.25 : viewport.width * 0.75;
            await page.touchscreen.tap(x, viewport.height / 2);
        }
        await expect(levelLabel(page, 4)).toBeVisible();
    });
});

test("the same seed plays the same game", async ({ page }) => {
    const playedWords = async (): Promise<string[]> => {
        const words: string[] = [];
        for (let level = 1; level <= 3; level++) {
            await expect(levelLabel(page, level)).toBeVisible();
            const { word, ink } = await readWord(page);
            words.push(`${word} in ${ink}`);
            await clearLevel(page, level);
        }
        return words;
    };

    await openGame(page, 7);
    await startFirstGame(page);
    const first = await playedWords();

    await openGame(page, 7);
    await button(page, "START GAME").click();
    expect(await playedWords()).toEqual(first);
});
