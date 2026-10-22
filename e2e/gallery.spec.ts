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
