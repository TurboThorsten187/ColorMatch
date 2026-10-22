import { describe, expect, it } from "vitest";
import { spin } from "./look.ts";

describe("spin", () => {
    it("turns a full turn in 2.5 s, the direction depends on the level", () => {
        expect(spin(0.2, 0)).toBe(0);
        expect(Math.abs(spin(0.2, 2500))).toBe(360);
        expect(Math.sign(spin(0.2, 100))).not.toBe(Math.sign(spin(0.8, 100)));
    });

    it("turns unevenly the stronger it is, but always forward, at most 1.5 times as fast and a full turn in 2.5 s on average", () => {
        const angles = Array.from({ length: 200 }, (_, i) => spin(0.2, i * 35, 1));
        const steps = angles.slice(1).map((angle, i) => angle - angles[i]);
        const average = (360 * 35) / 2500;

        expect(Math.min(...steps)).toBeGreaterThan(0);
        expect(Math.max(...steps)).toBeGreaterThan(1.4 * average);
        expect(Math.max(...steps)).toBeLessThanOrEqual(1.5 * average + 1e-9);
        expect(spin(0.2, 7000, 1)).toBeCloseTo(spin(0.2, 7000, 0));
    });
});
