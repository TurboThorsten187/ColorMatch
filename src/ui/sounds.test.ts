import { describe, expect, it } from "vitest";
import { LOSS_ANIMATION_MS, SQUASH_AT_MS } from "./screens/lossAnimation.ts";
import { cuesFor } from "./sounds.ts";

describe("sounds", () => {
    it("play the sound of the same name for simple events", () => {
        for (const kind of ["click", "hit", "miss", "lowTime", "award", "move"] as const) {
            expect(cuesFor({ kind })).toEqual([{ id: kind }]);
        }
    });

    it("follow a loss through the loss animation to the game over jingle", () => {
        expect(cuesFor({ kind: "lost", reason: "timeout", newRecord: false })).toEqual([
            { id: "timeout" },
            { id: "crt", options: { delayMs: SQUASH_AT_MS } },
            { id: "gameOver", options: { delayMs: LOSS_ANIMATION_MS } },
        ]);
        expect(cuesFor({ kind: "lost", reason: "early", newRecord: true }).map((cue) => cue.id)).toEqual([
            "miss",
            "crt",
            "record",
        ]);
    });

    it("raise every SPAM! tap by two semitones", () => {
        expect(cuesFor({ kind: "spamTap", count: 1 })).toEqual([{ id: "spamTap", options: { semitones: 0 } }]);
        expect(cuesFor({ kind: "spamTap", count: 3 })).toEqual([{ id: "spamTap", options: { semitones: 4 } }]);
    });

    it("let the surge banner and the modifier card wait for the hit", () => {
        expect(cuesFor({ kind: "surge" })[0].options?.delayMs).toBeGreaterThan(0);
        expect(cuesFor({ kind: "intro" })[0].options?.delayMs).toBeGreaterThan(0);
    });
});
