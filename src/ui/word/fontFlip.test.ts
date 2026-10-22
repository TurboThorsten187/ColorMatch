import { beforeAll, describe, expect, it, vi } from "vitest";
import { FLIP_FONTS } from "@/platform/fonts.ts";
import { flipLetters } from "./fontFlip.ts";

// Tests run without a DOM: every character measures the same, which is all the font choice needs
beforeAll(() => {
    vi.stubGlobal("document", {
        createElement: () => ({
            getContext: () => ({ font: "", measureText: (text: string) => ({ width: text.length * 60 }) }),
        }),
    });
});

function familiesOver(colorblind: boolean): Set<string> {
    const families = new Set<string>();
    for (let step = 0; step < 200; step++) {
        for (const letter of flipLetters("TRIANGLE", 0.42, step * 200, 1, 8, 1, colorblind)) {
            families.add(letter.font.family);
        }
    }
    return families;
}

describe("flipLetters", () => {
    it("uses every font, the thin ones too", () => {
        expect(familiesOver(false).size).toBe(FLIP_FONTS.length);
    });

    it("keeps to the thick fonts in the colorblind mode", () => {
        const thick = FLIP_FONTS.filter((font) => font.thick).map((font) => font.family);

        expect([...familiesOver(true)].sort()).toEqual([...thick].sort());
    });
});
