import { describe, expect, it } from "vitest";
import { seededRng } from "./random.ts";

describe("seededRng", () => {
    const draw = (seed: number, count: number): number[] => {
        const rng = seededRng(seed);
        return Array.from({ length: count }, () => rng());
    };

    it("repeats its numbers for the same seed", () => {
        expect(draw(42, 20)).toEqual(draw(42, 20));
    });

    it("gives other numbers for another seed", () => {
        expect(draw(1, 20)).not.toEqual(draw(2, 20));
    });

    it("stays in [0, 1) and spreads over it", () => {
        const values = draw(7, 10000);
        expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
        const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
        expect(mean).toBeGreaterThan(0.45);
        expect(mean).toBeLessThan(0.55);
    });
});
