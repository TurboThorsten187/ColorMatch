import { describe, expect, it } from "vitest";
import { INTROS } from "./intros.ts";
import { MODIFIER_GROUPS } from "./modifiers.ts";
import { NOW_SIGN, SIGNS, SPAM_COLOR } from "./signs.ts";

describe("signs", () => {
    it("give every rule a color of its own, NOW and SPAM! too", () => {
        const colors = [...Object.values(SIGNS).map((sign) => sign.color), NOW_SIGN.color, SPAM_COLOR];

        expect(new Set(colors).size).toBe(colors.length);
        expect(
            MODIFIER_GROUPS.filter((group) => group.rule)
                .map((group) => group.id)
                .sort(),
        ).toEqual([...Object.keys(SIGNS), "spam"].sort());
    });

    it("color the highlights of the rule cards, NOW's color on the WAIT card where white would not show", () => {
        const accent = (id: string): string | undefined => INTROS.find((intro) => intro.id === id)?.accent;

        for (const [id, sign] of Object.entries(SIGNS)) {
            expect(accent(id)).toBe(id === "wait" ? NOW_SIGN.color : sign.color);
        }
        expect(accent("spam")).toBe(SPAM_COLOR);
        expect(INTROS.find((intro) => intro.id === "spam")?.example.color).toBe(SPAM_COLOR);
    });
});
