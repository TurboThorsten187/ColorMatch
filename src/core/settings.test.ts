import { describe, expect, it } from "vitest";
import {
    answerOn,
    changeVolume,
    DEFAULT_SETTINGS,
    parseSettings,
    type Settings,
    sideOf,
    VOLUME_STEPS,
} from "./settings.ts";

describe("settings", () => {
    it("start with the defaults", () => {
        expect(parseSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    });

    it("read what was saved", () => {
        const settings: Settings = {
            sound: false,
            volume: 2,
            scanlines: false,
            colorblind: true,
            flipControls: true,
        };

        expect(parseSettings(JSON.parse(JSON.stringify(settings)))).toEqual(settings);
    });

    it("replace each invalid field with its default", () => {
        const stored = { sound: "yes", volume: 99, scanlines: false, colorblind: "on", flipControls: 1 };

        expect(parseSettings(stored)).toEqual({ ...DEFAULT_SETTINGS, scanlines: false });
    });

    it("ignore stored values that are not a settings object", () => {
        for (const stored of [42, null, "text", []]) {
            expect(parseSettings(stored)).toEqual(DEFAULT_SETTINGS);
        }
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

describe("flipped controls", () => {
    it("put TRUE on the left normally and on the right when flipped", () => {
        expect(answerOn("left", false)).toBe("true");
        expect(answerOn("right", false)).toBe("false");
        expect(answerOn("left", true)).toBe("false");
        expect(answerOn("right", true)).toBe("true");
    });

    it("find the side of an answer the other way round", () => {
        for (const flipped of [false, true]) {
            for (const side of ["left", "right"] as const) {
                expect(sideOf(answerOn(side, flipped), flipped)).toBe(side);
            }
        }
    });
});
