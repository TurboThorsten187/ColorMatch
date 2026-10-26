import { describe, expect, it } from "vitest";
import { answerOn, DEFAULT_SETTINGS, parseSettings, type Settings, sideOf } from "./settings.ts";

describe("settings", () => {
    it("start with the defaults", () => {
        expect(parseSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    });

    it("read what was saved", () => {
        const settings: Settings = {
            sound: false,
            volume: 2,
            vibration: false,
            scanlines: false,
            colorblind: true,
            flipControls: true,
        };

        expect(parseSettings(JSON.parse(JSON.stringify(settings)))).toEqual(settings);
    });

    it("replace each invalid field with its default", () => {
        const stored = {
            sound: "yes",
            volume: 99,
            vibration: "off",
            scanlines: false,
            colorblind: "on",
            flipControls: 1,
        };

        expect(parseSettings(stored)).toEqual({ ...DEFAULT_SETTINGS, scanlines: false });
    });

    it("turn vibration on for saves from before it existed", () => {
        const { vibration, ...older } = DEFAULT_SETTINGS;

        expect(parseSettings({ ...older, sound: false }).vibration).toBe(vibration);
    });

    it("ignore stored values that are not a settings object", () => {
        for (const stored of [42, null, "text", []]) {
            expect(parseSettings(stored)).toEqual(DEFAULT_SETTINGS);
        }
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
