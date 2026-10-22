import { describe, expect, it } from "vitest";
import { NEW_SAVE, type SaveData } from "@/core/save.ts";
import { clearSave, loadSave, removeOldSaves, writeSave } from "./storage.ts";
import { blockedStorage, memoryStorage } from "./testStorage.ts";

const PLAYED: SaveData = {
    ...NEW_SAVE,
    settings: { ...NEW_SAVE.settings, scanlines: false },
    highscores: { normal: 12, hardcore: 3 },
};

describe("storage", () => {
    it("starts as a new player", () => {
        expect(loadSave(memoryStorage())).toEqual(NEW_SAVE);
    });

    it("loads what was written", () => {
        const storage = memoryStorage();
        writeSave(storage, PLAYED);

        expect(loadSave(storage)).toEqual(PLAYED);
    });

    it("never lowers a highscore that another tab saved", () => {
        const storage = memoryStorage();
        writeSave(storage, PLAYED);
        writeSave(storage, { ...PLAYED, settings: NEW_SAVE.settings, highscores: { normal: 5, hardcore: 8 } });

        expect(loadSave(storage)).toEqual({
            ...PLAYED,
            settings: NEW_SAVE.settings,
            highscores: { normal: 12, hardcore: 8 },
        });
    });

    it("starts over when cleared or broken", () => {
        const storage = memoryStorage();
        writeSave(storage, PLAYED);
        clearSave(storage);
        expect(loadSave(storage)).toEqual(NEW_SAVE);

        storage.setItem("colormatch_save", "{broken");
        expect(loadSave(storage)).toEqual(NEW_SAVE);
    });

    it("removes the data of the old format and keeps the save", () => {
        const storage = memoryStorage();
        storage.setItem("colormatch_highscore", "40");
        storage.setItem("colormatch_settings", "{}");
        writeSave(storage, PLAYED);

        removeOldSaves(storage);

        expect(storage.getItem("colormatch_highscore")).toBeNull();
        expect(storage.getItem("colormatch_settings")).toBeNull();
        expect(loadSave(storage)).toEqual(PLAYED);
    });

    it("keeps working when storage is blocked or missing", () => {
        for (const storage of [blockedStorage, null]) {
            expect(loadSave(storage)).toEqual(NEW_SAVE);
            expect(() => writeSave(storage, PLAYED)).not.toThrow();
            expect(() => clearSave(storage)).not.toThrow();
            expect(() => removeOldSaves(storage)).not.toThrow();
        }
    });
});
