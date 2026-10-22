import { describe, expect, it } from "vitest";
import { lowTimeGlow } from "./lowTimeGlow.ts";

describe("low time glow", () => {
    it("is off until the timer turns red, then gets stronger until the time is up", () => {
        expect(lowTimeGlow(1, 0.25)).toBe(0);
        expect(lowTimeGlow(0.25, 0.25)).toBe(0);

        const start = lowTimeGlow(0.249, 0.25);
        const middle = lowTimeGlow(0.125, 0.25);
        const end = lowTimeGlow(0, 0.25);
        expect(start).toBeGreaterThan(0);
        expect(middle).toBeGreaterThan(start);
        expect(end).toBeGreaterThan(middle);
        expect(lowTimeGlow(-0.1, 0.25)).toBe(end);
    });
});
