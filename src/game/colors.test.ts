import { describe, expect, it } from "vitest";
import { COLOR_CSS, COLORS } from "./colors.ts";

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

function contrastOnWhite(hex: string): number {
    return 1.05 / (luminance(hex) + 0.05);
}

describe("colors", () => {
    it("are all readable on the white background", () => {
        for (const color of COLORS) {
            expect(contrastOnWhite(COLOR_CSS[color]), color).toBeGreaterThanOrEqual(2);
        }
    });

    it("are all distinct", () => {
        expect(new Set(Object.values(COLOR_CSS)).size).toBe(COLORS.length);
    });
});
