import { expect, test } from "@playwright/test";
import { button, openGame } from "./helpers.ts";

test.beforeEach(async ({ page }) => {
    await openGame(page);
});

test("shows the empty highscore and keeps HARDCORE locked", async ({ page }) => {
    await expect(page.getByText("HI-SCORE", { exact: true })).toBeVisible();
    await expect(page.getByText("000000", { exact: true })).toBeVisible();

    const hint = page.getByText("CLEAR LEVEL 50");
    await expect(hint).toBeHidden();
    // aria-disabled: Playwright would wait for it to be enabled, but locked it can still be pressed
    await button(page, "HARDCORE").click({ force: true });
    await expect(hint).toBeVisible();
    // Locked, it starts nothing
    await expect(button(page, "START GAME")).toBeVisible();
});

test("moves the selection with the arrow keys", async ({ page }) => {
    const keyHelp = page.getByText("ARROWS SELECT · ENTER OK · ESC BACK");
    await expect(keyHelp).toBeHidden();

    // The first key only shows where the selection is
    await page.keyboard.press("ArrowDown");
    await expect(button(page, "START GAME")).toBeFocused();
    await expect(keyHelp).toBeVisible();

    await page.keyboard.press("ArrowDown");
    await expect(button(page, "HARDCORE")).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(button(page, "START GAME")).toBeFocused();
});

test("opens the stats and goes back with Escape", async ({ page }) => {
    await button(page, "STATS").click();
    await expect(page.getByRole("heading", { name: "STATS" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "AWARDS" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(button(page, "START GAME")).toBeVisible();
});

test("opens the settings and goes back with the back button", async ({ page }) => {
    await button(page, "SETTINGS").click();
    await expect(page.getByRole("heading", { name: "SETTINGS" })).toBeVisible();

    await button(page, "Back").click();
    await expect(button(page, "START GAME")).toBeVisible();
});
