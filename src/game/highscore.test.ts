import { describe, expect, it } from "vitest";
import { type KeyValueStore, loadHighscore, saveHighscore } from "./highscore.ts";

function memoryStorage(): KeyValueStore {
    const data = new Map<string, string>();
    return {
        getItem: (key) => data.get(key) ?? null,
        setItem: (key, value) => void data.set(key, value),
    };
}

const blockedStorage: KeyValueStore = {
    getItem: () => {
        throw new Error("blocked");
    },
    setItem: () => {
        throw new Error("blocked");
    },
};

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

    it("keeps working when storage is blocked or missing", () => {
        expect(loadHighscore(blockedStorage)).toBe(0);
        expect(() => saveHighscore(blockedStorage, 5)).not.toThrow();
        expect(loadHighscore(null)).toBe(0);
        expect(() => saveHighscore(null, 5)).not.toThrow();
    });
});
