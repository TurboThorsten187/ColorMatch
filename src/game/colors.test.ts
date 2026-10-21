import { describe, expect, it } from "vitest";
import { COLOR_CSS, COLORS, SHAPE_WORDS, wordFor } from "./colors.ts";

// WCAG relative luminance of a #rrggbb color
function luminance(hex: string): number {
    const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
    if (!match) throw new Error(`Not a #rrggbb color: ${hex}`);
    const [r, g, b] = match
        .slice(1)
        .map((part) => Number.parseInt(part, 16) / 255)
        .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastOnBlack(hex: string): number {
    return (luminance(hex) + 0.05) / 0.05;
}

describe("colors", () => {
    // WCAG AA for large text: the colors are mostly the big color word, and blue is kept dark on purpose to stay apart
    // from cyan, at the cost of its small uses such as award codes
    it("are all readable on the black background", () => {
        for (const color of COLORS) {
            expect(contrastOnBlack(COLOR_CSS[color]), color).toBeGreaterThanOrEqual(3);
        }
    });

    it("are all distinct", () => {
        expect(new Set(Object.values(COLOR_CSS)).size).toBe(COLORS.length);
    });

    it("each name their own shape in the colorblind mode", () => {
        expect(new Set(COLORS.map((color) => wordFor(color, true))).size).toBe(COLORS.length);
        expect(wordFor("red", true)).toBe(SHAPE_WORDS.red);
        expect(wordFor("red", false)).toBe("RED");
    });
});
