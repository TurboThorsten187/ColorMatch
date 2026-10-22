import { describe, expect, it } from "vitest";
import { flipFont, fontWeight } from "./look.ts";

const EVEN = Array.from({ length: 28 }, () => 1);

describe("font flip", () => {
    it("gives every letter a new font every 200 ms, never the same twice in a row", () => {
        for (let letter = 0; letter < 6; letter++) {
            const fonts = Array.from({ length: 30 }, (_, step) => flipFont(0.42, letter, step * 200 + 50, EVEN));

            fonts.forEach((font, step) => {
                expect(font).toBeGreaterThanOrEqual(0);
                expect(font).toBeLessThan(28);
                if (step > 0) expect(font).not.toBe(fonts[step - 1]);
            });
            expect(flipFont(0.42, letter, 199, EVEN)).toBe(fonts[0]);
        }
    });

    it("mixes the fonts of the letters", () => {
        const fonts = new Set(Array.from({ length: 6 }, (_, letter) => flipFont(0.42, letter, 0, EVEN)));

        expect(fonts.size).toBeGreaterThan(1);
    });

    it("picks every font as often as its weight says", () => {
        // Font 0 never, font 1 three times as often as each of the others
        const weights = [0, 3, 1, 1, 1];
        const counts = [0, 0, 0, 0, 0];
        for (let letter = 0; letter < 40; letter++) {
            for (let step = 0; step < 100; step++) counts[flipFont(0.42, letter, step * 200, weights)]++;
        }

        expect(counts[0]).toBe(0);
        expect(counts[1]).toBeGreaterThan(1.5 * Math.max(counts[2], counts[3], counts[4]));
    });

    it("picks the wild fonts more often the stronger it is, 1.5 times as often at full strength", () => {
        expect(fontWeight(false, 1)).toBe(1);
        expect(fontWeight(true, 1)).toBeCloseTo(1.5 * fontWeight(true, 0));
        expect(fontWeight(true, 0)).toBeLessThan(1);
    });
});
