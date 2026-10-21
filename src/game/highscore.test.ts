import { describe, expect, it } from "vitest";
import {
    clearHighscore,
    HARDCORE_UNLOCK_SCORE,
    isHardcoreUnlocked,
    loadHighscore,
    saveHighscore,
} from "./highscore.ts";
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

    it("keeps a separate highscore for hardcore", () => {
        const storage = memoryStorage();
        saveHighscore(storage, 60);
        saveHighscore(storage, 12, "hardcore");

        expect(loadHighscore(storage)).toBe(60);
        expect(loadHighscore(storage, "normal")).toBe(60);
        expect(loadHighscore(storage, "hardcore")).toBe(12);
        saveHighscore(storage, 8, "hardcore");
        expect(loadHighscore(storage, "hardcore")).toBe(12);
    });

    it("can be cleared, every mode at once", () => {
        const storage = memoryStorage();
        saveHighscore(storage, 7);
        saveHighscore(storage, 3, "hardcore");

        clearHighscore(storage);

        expect(loadHighscore(storage)).toBe(0);
        expect(loadHighscore(storage, "hardcore")).toBe(0);
    });

    it("opens hardcore once a normal game has cleared level 50", () => {
        expect(isHardcoreUnlocked(0)).toBe(false);
        expect(isHardcoreUnlocked(HARDCORE_UNLOCK_SCORE - 1)).toBe(false);
        expect(isHardcoreUnlocked(HARDCORE_UNLOCK_SCORE)).toBe(true);
        expect(HARDCORE_UNLOCK_SCORE).toBe(50);
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
