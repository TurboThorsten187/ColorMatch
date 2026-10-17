import { describe, expect, it } from "vitest";
import {
    changeVolume,
    clearSettings,
    DEFAULT_SETTINGS,
    loadSettings,
    saveSettings,
    type Settings,
    VOLUME_STEPS,
} from "./settings.ts";
import { blockedStorage, memoryStorage } from "./testStorage.ts";

describe("settings", () => {
    it("start with the defaults", () => {
        expect(loadSettings(memoryStorage())).toEqual(DEFAULT_SETTINGS);
    });

    it("load what was saved", () => {
        const storage = memoryStorage();
        const settings: Settings = { sound: false, volume: 2, scanlines: false };

        saveSettings(storage, settings);

        expect(loadSettings(storage)).toEqual(settings);
    });

    it("replace each invalid field with its default", () => {
        const storage = memoryStorage();
        storage.setItem("colormatch_settings", JSON.stringify({ sound: "yes", volume: 99, scanlines: false }));

        expect(loadSettings(storage)).toEqual({ ...DEFAULT_SETTINGS, scanlines: false });
    });

    it("ignore stored values that are not a settings object", () => {
        const storage = memoryStorage();
        for (const stored of ["{broken", "42", "null", '"text"']) {
            storage.setItem("colormatch_settings", stored);
            expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
        }
    });

    it("go back to the defaults when cleared", () => {
        const storage = memoryStorage();
        saveSettings(storage, { sound: false, volume: 1, scanlines: false });

        clearSettings(storage);

        expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
    });

    it("keep working when storage is blocked or missing", () => {
        expect(loadSettings(blockedStorage)).toEqual(DEFAULT_SETTINGS);
        expect(() => saveSettings(blockedStorage, DEFAULT_SETTINGS)).not.toThrow();
        expect(() => clearSettings(blockedStorage)).not.toThrow();
        expect(loadSettings(null)).toEqual(DEFAULT_SETTINGS);
    });

    it("keep the volume between 1 and the number of steps", () => {
        const quiet = { ...DEFAULT_SETTINGS, volume: 1 };
        const loud = { ...DEFAULT_SETTINGS, volume: VOLUME_STEPS };

        expect(changeVolume(DEFAULT_SETTINGS, 1).volume).toBe(DEFAULT_SETTINGS.volume + 1);
        expect(changeVolume(DEFAULT_SETTINGS, -1).volume).toBe(DEFAULT_SETTINGS.volume - 1);
        expect(changeVolume(quiet, -1)).toBe(quiet);
        expect(changeVolume(loud, 1)).toBe(loud);
    });
});
