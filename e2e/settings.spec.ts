import { expect, type Page, test } from "@playwright/test";
import { button, clearLevel, levelLabel, openGame, readWord, startFirstGame } from "./helpers.ts";

// The ON or OFF button of a setting, pressed while the setting has that value
function toggle(page: Page, setting: string, value: "ON" | "OFF") {
    return page.getByRole("group", { name: setting }).getByRole("button", { name: value, exact: true });
}

// A pressed button acts a moment later, once it has given way: wait for that before leaving the screen
async function setToggle(page: Page, setting: string, value: "ON" | "OFF"): Promise<void> {
    await toggle(page, setting, value).click();
    await expect(toggle(page, setting, value)).toHaveAttribute("aria-pressed", "true");
}

async function openSettings(page: Page): Promise<void> {
    await button(page, "SETTINGS").click();
    await expect(page.getByRole("heading", { name: "SETTINGS" })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
    await openGame(page);
    await openSettings(page);
});

test("starts with the defaults", async ({ page }) => {
    await expect(toggle(page, "SOUND", "ON")).toHaveAttribute("aria-pressed", "true");
    await expect(toggle(page, "SCANLINES", "ON")).toHaveAttribute("aria-pressed", "true");
    await expect(toggle(page, "COLORBLIND", "OFF")).toHaveAttribute("aria-pressed", "true");
    await expect(toggle(page, "FLIP CONTROLS", "OFF")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("slider", { name: "VOLUME" })).toHaveAttribute("aria-valuenow", "5");
});

test("keeps the settings after a reload", async ({ page }) => {
    await setToggle(page, "SOUND", "OFF");
    await setToggle(page, "SCANLINES", "OFF");
    const volume = page.getByRole("slider", { name: "VOLUME" });
    await volume.focus();
    await page.keyboard.press("ArrowRight");
    await expect(volume).toHaveAttribute("aria-valuenow", "6");

    await page.reload();
    await openSettings(page);
    await expect(toggle(page, "SOUND", "OFF")).toHaveAttribute("aria-pressed", "true");
    await expect(toggle(page, "SCANLINES", "OFF")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("slider", { name: "VOLUME" })).toHaveAttribute("aria-valuenow", "6");
});

test("FLIP CONTROLS puts FALSE on the left", async ({ page }) => {
    await setToggle(page, "FLIP CONTROLS", "ON");
    await page.keyboard.press("Escape");

    await expect(page.getByText("◄ FALSE")).toBeVisible();
    await expect(page.getByText("TRUE ►")).toBeVisible();
    await startFirstGame(page);
    await clearLevel(page, 1, true);
    await clearLevel(page, 2, true);
});

test("COLORBLIND names shapes instead of colors", async ({ page }) => {
    await setToggle(page, "COLORBLIND", "ON");
    await page.keyboard.press("Escape");
    await startFirstGame(page);

    for (let level = 1; level <= 3; level++) {
        await expect(levelLabel(page, level)).toBeVisible();
        expect(["HEART", "TRIANGLE", "SQUARE", "STAR", "PLUS", "CIRCLE"]).toContain((await readWord(page)).word);
        await clearLevel(page, level);
    }
});

test("HOLD TO RESET clears the settings and the tutorial progress", async ({ page }) => {
    await setToggle(page, "FLIP CONTROLS", "ON");
    await page.keyboard.press("Escape");
    await startFirstGame(page);
    await page.reload();
    await openSettings(page);

    const reset = button(page, "HOLD TO RESET");
    // A short press is not enough
    await reset.hover();
    await page.mouse.down();
    await page.waitForTimeout(500);
    await page.mouse.up();
    await expect(reset).toBeVisible();

    await page.mouse.down();
    await expect(button(page, "DATA CLEARED")).toBeVisible({ timeout: 3_000 });
    await page.mouse.up();
    await expect(toggle(page, "FLIP CONTROLS", "OFF")).toHaveAttribute("aria-pressed", "true");

    await page.keyboard.press("Escape");
    await button(page, "START GAME").click();
    await expect(page.getByText("HOW TO PLAY")).toBeVisible();
});
