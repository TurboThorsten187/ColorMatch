import { describe, expect, it } from "vitest";
import { HARDCORE_UNLOCK_SCORE } from "./balance.ts";
import { bestHighscores, isHardcoreUnlocked, NO_HIGHSCORES, parseHighscores } from "./highscore.ts";

describe("highscore", () => {
    it("opens hardcore once a normal game has cleared level 50", () => {
        expect(isHardcoreUnlocked(0)).toBe(false);
        expect(isHardcoreUnlocked(HARDCORE_UNLOCK_SCORE - 1)).toBe(false);
        expect(isHardcoreUnlocked(HARDCORE_UNLOCK_SCORE)).toBe(true);
        expect(HARDCORE_UNLOCK_SCORE).toBe(50);
    });

    it("reads a whole score of at least 0 for every mode", () => {
        expect(parseHighscores({ normal: 7, hardcore: 3 })).toEqual({ normal: 7, hardcore: 3 });
        expect(parseHighscores({ normal: -1, hardcore: 2.5 })).toEqual(NO_HIGHSCORES);
        expect(parseHighscores({ normal: "12" })).toEqual(NO_HIGHSCORES);
        expect(parseHighscores({ normal: 60 })).toEqual({ normal: 60, hardcore: 0 });
        expect(parseHighscores(null)).toEqual(NO_HIGHSCORES);
    });

    it("keeps the better score of each mode", () => {
        expect(bestHighscores({ normal: 7, hardcore: 1 }, { normal: 3, hardcore: 9 })).toEqual({
            normal: 7,
            hardcore: 9,
        });
    });
});
