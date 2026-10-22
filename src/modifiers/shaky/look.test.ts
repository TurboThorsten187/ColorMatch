import { describe, expect, it } from "vitest";
import { shake, shakeFontScale, shakeReach, shakeTiltDeg } from "./look.ts";

const AREA = { width: 400, height: 500 };

describe("shake", () => {
    it("jumps and tilts in small steps around the place, a new jump every 60 ms", () => {
        const reach = shakeReach(AREA, 0, 1);
        const jumps = Array.from({ length: 50 }, (_, i) => shake(0.7, i * 60, reach, 0));

        expect(new Set(jumps.map((jump) => jump.x)).size).toBeGreaterThan(40);
        expect(new Set(jumps.map((jump) => jump.rotation)).size).toBeGreaterThan(40);
        for (const { x, y, rotation } of jumps) {
            expect(Math.abs(x)).toBeLessThanOrEqual(AREA.width * 0.02);
            expect(Math.abs(y)).toBeLessThanOrEqual(AREA.height * 0.05);
            expect(Math.abs(rotation)).toBeLessThanOrEqual(shakeTiltDeg(0));
        }
        expect(shake(0.7, 61, reach, 0)).toEqual(shake(0.7, 119, reach, 0));
    });

    it("reaches and tilts further the stronger it is, at most 1.5 times as far, and shrinks the word more", () => {
        expect(shakeReach(AREA, 1, 1).x).toBeCloseTo(1.5 * shakeReach(AREA, 0, 1).x);
        expect(shakeTiltDeg(0)).toBe(4);
        expect(shakeTiltDeg(1)).toBe(6);
        expect(shakeFontScale(1)).toBeLessThan(shakeFontScale(0));
    });

    it("shakes a zoomed word as much relative to its size as a normal word", () => {
        const normal = shakeReach(AREA, 0, 1);
        const zoomed = shakeReach(AREA, 0, 0.2);

        expect(zoomed.x).toBeCloseTo(normal.x * 0.2);
        expect(zoomed.y).toBeCloseTo(normal.y * 0.2);
    });
});
