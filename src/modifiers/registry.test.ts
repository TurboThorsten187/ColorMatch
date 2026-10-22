import { describe, expect, it } from "vitest";
import { conflicts, groupById, inGroupOrder, MODIFIER_GROUPS } from "./registry.ts";

describe("modifier groups", () => {
    it("are each listed once under their own id", () => {
        const ids = MODIFIER_GROUPS.map((group) => group.id);

        expect(new Set(ids).size).toBe(ids.length);
        expect(ids).toHaveLength(21);
        for (const id of ids) expect(groupById(id).id).toBe(id);
    });

    it("contain every modifier exactly once", () => {
        const variants = MODIFIER_GROUPS.flatMap((group) => group.variants);

        expect(new Set(variants).size).toBe(variants.length);
        expect(variants).toHaveLength(23);
    });

    it("only name existing other groups as conflicts", () => {
        const ids = new Set(MODIFIER_GROUPS.map((group) => group.id));
        for (const group of MODIFIER_GROUPS) {
            for (const other of group.conflictsWith ?? []) {
                expect(ids.has(other), `${group.id} conflicts with ${other}`).toBe(true);
                expect(other).not.toBe(group.id);
            }
        }
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
        expect(conflicts("zoom", "blur")).toBe(true);
        expect(conflicts("moving", "blur")).toBe(true);

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

    it("sort ids in the order of the list", () => {
        expect(inGroupOrder(["twoWords", "rotation", "mirror"])).toEqual(["mirror", "rotation", "twoWords"]);
    });

    it("all have an intro card and an award with a badge code of its own", () => {
        const codes = MODIFIER_GROUPS.map((group) => group.award.code);

        expect(new Set(codes).size).toBe(codes.length);
        for (const group of MODIFIER_GROUPS) {
            expect(group.award.code).toMatch(/^[A-Z]{2}$/);
            expect(group.intro.title).not.toBe("");
            expect(group.intro.lines.length).toBeGreaterThan(0);
        }
    });

    it("mark every rule but SPAM! with a sign of 7 x 7 pixel icons, no two alike", () => {
        const icons = MODIFIER_GROUPS.flatMap((group) => {
            if (group.rule === undefined) {
                expect(group.sign, group.id).toBeUndefined();
                return [];
            }
            if (group.id === "spam") return [];
            if (!group.sign) throw new Error(`${group.id} has no sign`);
            return [group.sign(0).icon, group.sign(1).icon];
        });
        const distinct = [...new Map(icons.map((icon) => [icon.rows.join("|"), icon])).values()];

        expect(distinct).toHaveLength(6);
        for (const icon of distinct) {
            expect(icon.rows).toHaveLength(7);
            for (const row of icon.rows) expect(row).toMatch(/^[#.]{7}$/);
        }
    });
});
