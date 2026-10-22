import { expect, test } from "@playwright/test";
import { button, clearLevel, expectGameOver, missLevel, openGame, startFirstGame } from "./helpers.ts";

test("a second tab takes over what the first one saved, and keeps it", async ({ context, page }) => {
    const other = await context.newPage();
    await openGame(other);
    await openGame(page);

    await startFirstGame(page);
    await clearLevel(page, 1);
    await clearLevel(page, 2);
    await missLevel(page);
    await expectGameOver(page, 2);
    await expect(other.getByText("000002", { exact: true })).toBeVisible();

    // The other tab saves everything it holds, the new highscore included
    await button(other, "SETTINGS").click();
    const scanlinesOff = other.getByRole("group", { name: "SCANLINES" }).getByRole("button", { name: "OFF" });
    await scanlinesOff.click();
    await expect(scanlinesOff).toHaveAttribute("aria-pressed", "true");

    await page.goto("/");
    await expect(page.getByText("000002", { exact: true })).toBeVisible();
    await button(page, "SETTINGS").click();
    await expect(page.getByRole("group", { name: "SCANLINES" }).getByRole("button", { name: "OFF" })).toHaveAttribute(
        "aria-pressed",
        "true",
    );
});

test("starts over from saves of the old format", async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.setItem("colormatch_highscore", "40");
        localStorage.setItem("colormatch_tutorial", JSON.stringify({ done: true, seenIntros: [] }));
    });
    await openGame(page);

    await expect(page.getByText("000000", { exact: true })).toBeVisible();
    await button(page, "START GAME").click();
    await expect(page.getByText("HOW TO PLAY")).toBeVisible();
});
