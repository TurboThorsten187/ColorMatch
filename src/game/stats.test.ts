import { describe, expect, it } from "vitest";
import { AWARDS, MODIFIER_CLEARS_NEEDED } from "./awards.ts";
import type { ModifierId } from "./modifiers.ts";
import {
    averageLevel,
    averageReactionMs,
    awardProgress,
    clearLevel,
    clearStats,
    EMPTY_STATS,
    finishGame,
    formatPlayTime,
    loadStats,
    saveStats,
    type Stats,
    unlockMilestones,
} from "./stats.ts";
import { blockedStorage, memoryStorage } from "./testStorage.ts";

function clear(stats: Stats, level: number, modifiers: ModifierId[] = [], reactionMs: number | null = 500) {
    return clearLevel(stats, { level, modifiers: new Set(modifiers), reactionMs });
}

function award(id: string) {
    const found = AWARDS.find((candidate) => candidate.id === id);
    if (!found) throw new Error(`No award ${id}`);
    return found;
}

describe("awards", () => {
    it("have unique ids and badge codes", () => {
        expect(new Set(AWARDS.map((a) => a.id)).size).toBe(AWARDS.length);
        expect(new Set(AWARDS.map((a) => a.code)).size).toBe(AWARDS.length);
    });
});

describe("stats", () => {
    it("count a cleared level once per modifier award", () => {
        const { stats } = clear(EMPTY_STATS, 7, ["mirrorVertical", "mirrorHorizontal", "rotation"]);

        expect(stats.clears).toEqual({ mirror: 1, rotation: 1 });
    });

    it("average only answered levels for the reaction time", () => {
        let stats = clear(EMPTY_STATS, 1, [], 400).stats;
        stats = clear(stats, 2, [], 600).stats;
        stats = clear(stats, 3, ["noClick"], null).stats;

        expect(averageReactionMs(stats)).toBe(500);
        expect(averageReactionMs(EMPTY_STATS)).toBeNull();
    });

    it("unlock a modifier award with the last needed clear, exactly once", () => {
        let stats = EMPTY_STATS;
        for (let i = 1; i < MODIFIER_CLEARS_NEEDED; i++) {
            const result = clear(stats, 20, ["spam"], null);
            expect(result.unlocked).not.toContain("spam");
            stats = result.stats;
        }

        const last = clear(stats, 20, ["spam"], null);
        expect(last.unlocked).toEqual(["spam"]);
        expect(clear(last.stats, 21, ["spam"], null).unlocked).toEqual([]);
    });

    it("unlock level milestones when the level is cleared", () => {
        expect(clear(EMPTY_STATS, 9).unlocked).toEqual([]);
        expect(clear(EMPTY_STATS, 10).unlocked).toEqual(["level10"]);
    });

    it("unlock milestones of an older highscore silently", () => {
        const stats = unlockMilestones(EMPTY_STATS, 30);

        expect(stats.awards).toEqual(["level10", "level25"]);
        expect(unlockMilestones(stats, 30)).toBe(stats);
    });

    it("add finished games to the totals", () => {
        let stats = finishGame(EMPTY_STATS, 5, 20_000);
        stats = finishGame(stats, 10, 40_000);

        expect(stats.games).toBe(2);
        expect(averageLevel(stats)).toBe(8);
        expect(stats.playMs).toBe(60_000);
        expect(averageLevel(EMPTY_STATS)).toBeNull();
    });

    it("show award progress capped at the goal", () => {
        const stats = clear(EMPTY_STATS, 5, ["blur"]).stats;

        expect(awardProgress(award("blur"), stats, 0)).toEqual({ have: 1, need: MODIFIER_CLEARS_NEEDED });
        expect(awardProgress(award("level25"), stats, 47)).toEqual({ have: 25, need: 25 });
        expect(awardProgress(award("level50"), stats, 47)).toEqual({ have: 47, need: 50 });
    });

    it("format the play time like an arcade cabinet", () => {
        expect(formatPlayTime(0)).toBe("0M 0S");
        expect(formatPlayTime(192_500)).toBe("3M 12S");
        expect(formatPlayTime(6_120_000)).toBe("1H 42M");
    });
});

describe("stats storage", () => {
    it("loads what was saved", () => {
        const storage = memoryStorage();
        const stats = finishGame(clear(EMPTY_STATS, 10, ["spam"]).stats, 11, 1000);

        saveStats(storage, stats);

        expect(loadStats(storage)).toEqual(stats);
    });

    it("replaces invalid fields and drops unknown awards", () => {
        const storage = memoryStorage();
        storage.setItem(
            "colormatch_stats",
            JSON.stringify({
                games: -3,
                levelSum: "x",
                playMs: 500,
                clears: { spam: 4, level10: 2, nonsense: 9, blur: "many" },
                awards: ["spam", "spam", "unknown", 7],
            }),
        );

        expect(loadStats(storage)).toEqual({ ...EMPTY_STATS, playMs: 500, clears: { spam: 4 }, awards: ["spam"] });
    });

    it("ignores stored values that are not a stats object", () => {
        const storage = memoryStorage();
        for (const stored of ["{broken", "42", "null", "[]"]) {
            storage.setItem("colormatch_stats", stored);
            expect(loadStats(storage)).toEqual(EMPTY_STATS);
        }
    });

    it("starts empty again when cleared", () => {
        const storage = memoryStorage();
        saveStats(storage, finishGame(EMPTY_STATS, 3, 1000));

        clearStats(storage);

        expect(loadStats(storage)).toEqual(EMPTY_STATS);
    });

    it("keeps working when storage is blocked or missing", () => {
        expect(loadStats(blockedStorage)).toEqual(EMPTY_STATS);
        expect(() => saveStats(blockedStorage, EMPTY_STATS)).not.toThrow();
        expect(() => clearStats(blockedStorage)).not.toThrow();
        expect(loadStats(null)).toEqual(EMPTY_STATS);
    });
});
