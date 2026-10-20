import { describe, expect, it } from "vitest";
import { conflicts, groupsOf, MODIFIER_GROUPS, type ModifierId } from "./modifiers.ts";

describe("modifier groups", () => {
    it("contain every modifier exactly once", () => {
        const variants = MODIFIER_GROUPS.flatMap((group) => group.variants);

        expect(new Set(variants).size).toBe(variants.length);
        expect(variants).toHaveLength(23);
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

    it("keep apart the pairs that do not work together", () => {
        expect(conflicts("splitMirror", "scrambled")).toBe(true);
        expect(conflicts("splitMirror", "spam")).toBe(true);
        for (const id of ["assemble", "negative", "wait", "twoWords"] as const) {
            expect(conflicts(id, "blink")).toBe(true);
        }
        expect(conflicts("wait", "invertInput")).toBe(true);

        expect(conflicts("mirror", "rotation")).toBe(false);
        expect(conflicts("zoom", "moving")).toBe(false);
        expect(conflicts("fontFlip", "scrambled")).toBe(false);
        expect(conflicts("assemble", "spam")).toBe(false);
        expect(conflicts("negative", "invertInput")).toBe(false);
        expect(conflicts("twoWords", "splitMirror")).toBe(false);
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
