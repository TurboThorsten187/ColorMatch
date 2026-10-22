import { describe, expect, it } from "vitest";
import { pulseFontScale, pulseRange, pulseScale } from "./look.ts";

describe("pulse", () => {
    it("swings between 85 % and 108 %, and 1.5 times as far from 100 % at full strength", () => {
        for (const [strength, low, high] of [
            [0, 0.85, 1.08],
            [1, 0.775, 1.12],
        ]) {
            const scales = Array.from({ length: 100 }, (_, i) => pulseScale(0.5, i * 13, strength));

            expect(pulseRange(strength)).toEqual({ low: expect.closeTo(low), high: expect.closeTo(high) });
            expect(Math.min(...scales)).toBeGreaterThanOrEqual(low - 1e-9);
            expect(Math.max(...scales)).toBeLessThanOrEqual(high + 1e-9);
            expect(Math.max(...scales) - Math.min(...scales)).toBeGreaterThan((high - low) * 0.95);
        }
    });

    it("shrinks the font so the word fits at its largest", () => {
        expect(pulseFontScale(0) * pulseRange(0).high).toBeCloseTo(1);
        expect(pulseFontScale(1)).toBeLessThan(pulseFontScale(0));
    });
});
