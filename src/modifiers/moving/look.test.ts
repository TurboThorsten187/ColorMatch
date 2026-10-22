import { describe, expect, it } from "vitest";
import { drift } from "./look.ts";

const AREA = { width: 400, height: 500 };
const WORD = { width: 160, height: 40 };
const STILL = { x: 0, y: 0 };

describe("drift", () => {
    it("keeps the word inside the area, and further from its sides when asked", () => {
        for (let played = 0; played < 10000; played += 37) {
            const { x, y } = drift(0.3, played, AREA, WORD, STILL);
            expect(Math.abs(x)).toBeLessThanOrEqual((AREA.width - WORD.width) / 2);
            expect(Math.abs(y)).toBeLessThanOrEqual((AREA.height - WORD.height) / 2);

            const kept = drift(0.3, played, AREA, WORD, { x: 15, y: 20 });
            expect(Math.abs(kept.x)).toBeLessThanOrEqual((AREA.width - WORD.width) / 2 - 15);
            expect(Math.abs(kept.y)).toBeLessThanOrEqual((AREA.height - WORD.height) / 2 - 20);
        }
    });

    it("travels across the whole area", () => {
        const xs = Array.from({ length: 300 }, (_, i) => drift(0.3, i * 20, AREA, WORD, STILL).x);

        expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(AREA.width - WORD.width - 40);
    });

    it("stays in the middle when the word fills the area", () => {
        const { x, y } = drift(0.3, 1234, WORD, WORD, STILL);

        expect(Math.abs(x)).toBe(0);
        expect(Math.abs(y)).toBe(0);
    });
});
