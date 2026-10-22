import { describe, expect, it } from "vitest";
import { AFTERIMAGE_MS, afterimageOpacity, isNegative } from "./look.ts";

describe("negative", () => {
    it("shows from 10 % to 50 % of the time limit, then fades out its afterimage", () => {
        expect([0, 99, 100, 499, 500].map((elapsed) => isNegative(elapsed, 1000))).toEqual([
            false,
            false,
            true,
            true,
            false,
        ]);
        expect(afterimageOpacity(499, 1000)).toBe(0);
        expect(afterimageOpacity(500, 1000)).toBe(1);
        expect(afterimageOpacity(500 + AFTERIMAGE_MS / 2, 1000)).toBeCloseTo(0.5);
        expect(afterimageOpacity(500 + AFTERIMAGE_MS, 1000)).toBe(0);
    });
});
