import { afterEach, describe, expect, it, vi } from "vitest";
import { getHighscore, saveHighscore } from "./highscore.ts";

describe("highscore", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("only saves higher scores", () => {
        const data = new Map<string, string>();
        vi.stubGlobal("localStorage", {
            getItem: (key: string) => data.get(key) ?? null,
            setItem: (key: string, value: string) => data.set(key, value),
        });

        expect(getHighscore()).toBe(0);
        saveHighscore(7);
        expect(getHighscore()).toBe(7);
        saveHighscore(3);
        expect(getHighscore()).toBe(7);
    });

    it("keeps working when localStorage is blocked", () => {
        vi.stubGlobal("localStorage", {
            getItem: () => { throw new Error("blocked"); },
            setItem: () => { throw new Error("blocked"); },
        });

        expect(getHighscore()).toBe(0);
        expect(() => saveHighscore(5)).not.toThrow();
    });
});
