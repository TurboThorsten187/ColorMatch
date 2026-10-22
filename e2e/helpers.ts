import { expect, type Locator, type Page } from "@playwright/test";

// The tests only use what a player sees, plus the `data-ink` of the drawn word: roles, labels and texts stay while the
// code behind them is rebuilt.

export type Answer = "true" | "false";

// The colorblind mode names a shape for every color (src/core/colors.ts)
const SHAPE_COLORS: Readonly<Record<string, string>> = {
    HEART: "red",
    TRIANGLE: "green",
    SQUARE: "blue",
    STAR: "yellow",
    PLUS: "purple",
    CIRCLE: "cyan",
};

// The same seed plays the same game, so a failure can be watched again with the same URL
export async function openGame(page: Page, seed = 1): Promise<void> {
    await page.goto(`/?seed=${seed}`);
    await expect(button(page, "START GAME")).toBeFocused();
}

export function button(page: Page, name: string): Locator {
    return page.getByRole("button", { name, exact: true });
}

export function levelLabel(page: Page, level: number): Locator {
    return page.getByText(`LV ${level}`, { exact: true });
}

// Taps and clicks right after leaving a card are ignored, so a double click cannot answer the level behind it
export const CARD_INPUT_LOCK_MS = 300;

// A new player's first START shows the tutorial, SKIP starts the game right away
export async function startFirstGame(page: Page): Promise<void> {
    await button(page, "START GAME").click();
    await expect(page.getByText("HOW TO PLAY")).toBeVisible();
    await button(page, "SKIP").click();
    await expect(levelLabel(page, 1)).toBeVisible();
}

// The word on screen and its ink; plain levels and the practice draw a single word as one text
export async function readWord(page: Page): Promise<{ word: string; ink: string }> {
    const word = page.locator("[data-ink]");
    await expect(word).toHaveCount(1);
    return { word: ((await word.textContent()) ?? "").trim(), ink: (await word.getAttribute("data-ink")) ?? "" };
}

export async function rightAnswer(page: Page): Promise<Answer> {
    const { word, ink } = await readWord(page);
    return (SHAPE_COLORS[word] ?? word.toLowerCase()) === ink ? "true" : "false";
}

export function opposite(answer: Answer): Answer {
    return answer === "true" ? "false" : "true";
}

// TRUE is the left arrow, FALSE the right one; FLIP CONTROLS swaps them
export function keyFor(answer: Answer, flipControls = false): string {
    return (answer === "true") !== flipControls ? "ArrowLeft" : "ArrowRight";
}

// Answers the plain level `level` right and waits for the next one
export async function clearLevel(page: Page, level: number, flipControls = false): Promise<void> {
    await expect(levelLabel(page, level)).toBeVisible();
    await page.keyboard.press(keyFor(await rightAnswer(page), flipControls));
    await expect(levelLabel(page, level + 1)).toBeVisible();
}

// Answers the current level wrong, the game is lost
export async function missLevel(page: Page): Promise<void> {
    await page.keyboard.press(keyFor(opposite(await rightAnswer(page))));
}

// The game over screen after the loss animation; RETRY and MENU only react after a moment
export async function expectGameOver(page: Page, score: number): Promise<void> {
    await expect(page.getByRole("heading", { name: "GAME OVER" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(String(score).padStart(6, "0"), { exact: true }).first()).toBeVisible();
    await expect(button(page, "RETRY")).toBeEnabled({ timeout: 5_000 });
}

// A number on the stats screen, by its label
export function statValue(page: Page, label: string): Locator {
    return page.locator(`dt:text-is("${label}") + dd`);
}

// Leaving the tab or window pauses the game
export async function leaveWindow(page: Page): Promise<void> {
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
}
