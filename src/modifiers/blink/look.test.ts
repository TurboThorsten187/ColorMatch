import { describe, expect, it } from "vitest";
import { fadeOpacity } from "./look.ts";

describe("fade", () => {
    it("fades the word out within 0.9 s", () => {
        expect(fadeOpacity(0)).toBe(1);
        expect(fadeOpacity(450)).toBeCloseTo(0.5);
        expect(fadeOpacity(900)).toBe(0);
        expect(fadeOpacity(5000)).toBe(0);
    });
});
