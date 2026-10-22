import { describe, expect, it } from "vitest";
import { NEW_SAVE, parseSave, SAVE_VERSION, type SaveData, serializeSave } from "./save.ts";
import { DEFAULT_SETTINGS } from "./settings.ts";
import { EMPTY_STATS, finishGame } from "./stats.ts";

const PLAYED: SaveData = {
    settings: { ...DEFAULT_SETTINGS, volume: 2, flipControls: true },
    highscores: { normal: 42, hardcore: 7 },
    stats: finishGame(EMPTY_STATS, 43, 60_000),
    progress: { done: true, seenIntros: ["mirror", "spam"] },
};

describe("save", () => {
    it("reads what it wrote", () => {
        expect(parseSave(JSON.parse(serializeSave(PLAYED)))).toEqual(PLAYED);
    });

    it("stores its format version", () => {
        expect(JSON.parse(serializeSave(PLAYED))).toMatchObject({ version: SAVE_VERSION });
    });

    it("starts over without a save or with one of another version", () => {
        const stored = JSON.parse(serializeSave(PLAYED));

        expect(parseSave(null)).toEqual(NEW_SAVE);
        expect(parseSave({ ...stored, version: SAVE_VERSION + 1 })).toEqual(NEW_SAVE);
        expect(parseSave({ ...stored, version: undefined })).toEqual(NEW_SAVE);
    });

    it("replaces a broken part on its own", () => {
        const stored = { ...JSON.parse(serializeSave(PLAYED)), stats: "lost", highscores: null };

        expect(parseSave(stored)).toEqual({ ...PLAYED, stats: EMPTY_STATS, highscores: NEW_SAVE.highscores });
    });
});
