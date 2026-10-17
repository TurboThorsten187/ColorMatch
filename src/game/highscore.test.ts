import { describe, expect, it } from "vitest";
import { clearHighscore, loadHighscore, saveHighscore } from "./highscore.ts";
import { blockedStorage, memoryStorage } from "./testStorage.ts";

describe("highscore", () => {
    it("only saves higher scores", () => {
        const storage = memoryStorage();

        expect(loadHighscore(storage)).toBe(0);
        saveHighscore(storage, 7);
        expect(loadHighscore(storage)).toBe(7);
        saveHighscore(storage, 3);
        expect(loadHighscore(storage)).toBe(7);
    });

    it("ignores invalid stored values", () => {
        const storage = memoryStorage();
        storage.setItem("colormatch_highscore", "abc");

        expect(loadHighscore(storage)).toBe(0);
    });

    it("can be cleared", () => {
        const storage = memoryStorage();
        saveHighscore(storage, 7);

        clearHighscore(storage);

        expect(loadHighscore(storage)).toBe(0);
    });

    it("keeps working when storage is blocked or missing", () => {
        expect(loadHighscore(blockedStorage)).toBe(0);
        expect(() => saveHighscore(blockedStorage, 5)).not.toThrow();
        expect(() => clearHighscore(blockedStorage)).not.toThrow();
        expect(loadHighscore(null)).toBe(0);
        expect(() => saveHighscore(null, 5)).not.toThrow();
        expect(() => clearHighscore(null)).not.toThrow();
    });
});
