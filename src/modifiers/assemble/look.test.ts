import { describe, expect, it } from "vitest";
import { ASSEMBLE_SHARE, assembleRemaining, assembleStart } from "./look.ts";

const AREA = { width: 400, height: 500 };

describe("assembled letters", () => {
    it("start at their place outside the screen and are all in place at a quarter of the time", () => {
        const limit = 2000;
        for (let letter = 0; letter < 8; letter++) {
            expect(assembleRemaining(0.42, letter, 0, limit)).toBe(1);
            expect(assembleRemaining(0.42, letter, limit * ASSEMBLE_SHARE, limit)).toBe(0);
            expect(assembleRemaining(0.42, letter, limit, limit)).toBe(0);
            const halfway = assembleRemaining(0.42, letter, (limit * ASSEMBLE_SHARE) / 2, limit);
            expect(halfway).toBeGreaterThanOrEqual(0);
            expect(halfway).toBeLessThanOrEqual(1);
        }
    });

    it("fly in from just outside an edge", () => {
        for (let letter = 0; letter < 40; letter++) {
            const { x, y } = assembleStart(0.42, letter, AREA, 30);
            const outside = Math.abs(x) === AREA.width / 2 + 30 || Math.abs(y) === AREA.height / 2 + 30;

            expect(outside).toBe(true);
            expect(Math.abs(x)).toBeLessThanOrEqual(AREA.width / 2 + 30);
            expect(Math.abs(y)).toBeLessThanOrEqual(AREA.height / 2 + 30);
        }
    });
});
