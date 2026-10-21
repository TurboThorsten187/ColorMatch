import { describe, expect, it } from "vitest";
import { ICON_SIZE, pixelsOf, RULE_ICONS } from "./ruleIcons.ts";

describe("rule icons", () => {
    it("are 7 x 7 pixels each, and no two are alike", () => {
        const icons = Object.values(RULE_ICONS);
        for (const icon of icons) {
            expect(icon.rows).toHaveLength(ICON_SIZE);
            for (const row of icon.rows) expect(row).toMatch(new RegExp(`^[#.]{${ICON_SIZE}}$`));
        }
        expect(new Set(icons.map((icon) => icon.rows.join("|"))).size).toBe(icons.length);
    });

    it("lists the pixels of an icon by column and row", () => {
        const pixels = pixelsOf(RULE_ICONS.now);

        expect(pixels).toHaveLength(16);
        expect(pixels[0]).toEqual({ x: 0, y: 0 });
        expect(pixels).toContainEqual({ x: 3, y: 3 });
    });
});
