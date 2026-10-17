import { describe, expect, it } from "vitest";
import { conflicts, groupsOf, MODIFIER_GROUPS, type ModifierId } from "./modifiers.ts";

describe("modifier groups", () => {
    it("contain every modifier exactly once", () => {
        const variants = MODIFIER_GROUPS.flatMap((group) => group.variants);

        expect(new Set(variants).size).toBe(variants.length);
        expect(variants).toHaveLength(14);
    });

    it("find the groups of a level's modifiers", () => {
        const modifiers = new Set<ModifierId>(["mirrorHorizontal", "spam"]);

        expect(groupsOf(modifiers)).toEqual(["mirror", "spam"]);
        expect(groupsOf(new Set())).toEqual([]);
    });

    it("never combine two groups that change the correct input", () => {
        expect(conflicts("invertInput", "noClick")).toBe(true);
        expect(conflicts("spam", "invertInput")).toBe(true);
        expect(conflicts("invertInput", "mirror")).toBe(false);
    });

    it("conflict both ways", () => {
        for (const a of MODIFIER_GROUPS) {
            for (const b of MODIFIER_GROUPS) {
                expect(conflicts(a.id, b.id)).toBe(conflicts(b.id, a.id));
            }
        }
        expect(conflicts("scrambled", "spam")).toBe(true);
    });
});
