import { describe, expect, it } from "vitest";
import { maxModifierCount, MODIFIERS, pickModifiers } from "./modifiers.ts";

describe("pickModifiers", () => {
    it("picks nothing before level 5", () => {
        for (let level = 1; level < 5; level++) {
            for (let run = 0; run < 50; run++) {
                expect(pickModifiers(level, Math.random).size).toBe(0);
            }
        }
    });

    it("respects level limits, max count and conflicts", () => {
        for (let level = 1; level <= 60; level++) {
            for (let run = 0; run < 200; run++) {
                const picked = pickModifiers(level, Math.random);

                expect(picked.size).toBeLessThanOrEqual(maxModifierCount(level));
                for (const modifier of MODIFIERS.filter((m) => picked.has(m.id))) {
                    expect(modifier.minLevel).toBeLessThanOrEqual(level);
                    for (const other of picked) {
                        expect(modifier.conflictsWith).not.toContain(other);
                    }
                }
            }
        }
    });

    it("allows one more modifier every 10 levels, up to 3", () => {
        expect(maxModifierCount(5)).toBe(1);
        expect(maxModifierCount(10)).toBe(2);
        expect(maxModifierCount(20)).toBe(3);
        expect(maxModifierCount(99)).toBe(3);
    });
});
