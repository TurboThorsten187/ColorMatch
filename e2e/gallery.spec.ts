import { expect, test } from "@playwright/test";
import { button } from "./helpers.ts";

// The modifier gallery for developers (src/ui/dev/Gallery.svelte) draws with the game's own renderer

test("draws every modifier group and opens its intro card", async ({ page }) => {
    await page.goto("/?gallery&t=500");

    await expect(page.getByRole("figure")).toHaveCount(21);
    for (const figure of await page.getByRole("figure").all()) {
        await expect(figure.locator("[data-ink]").first()).toBeAttached();
    }

    await page.getByRole("link", { name: "ROTATION", exact: true }).click();
    await expect(page.getByRole("heading", { name: "ROTATION" })).toBeVisible();
    await button(page, "GOT IT").click();
    await expect(page.getByRole("figure")).toHaveCount(21);
});

test("draws a combination as a whole level screen", async ({ page }) => {
    await page.goto("/?gallery=rotation,background&level=22&t=700&screen&highscore=64");

    await expect(page.getByText("LV 22", { exact: true })).toBeVisible();
    await expect(page.getByText("HI 064", { exact: true })).toBeVisible();
    await expect(page.locator("[data-ink]").first()).toBeAttached();
});
