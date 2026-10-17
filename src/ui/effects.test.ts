import { describe, expect, it } from "vitest";
import type { ModifierId } from "../game/modifiers.ts";
import { effectFontScale, letterOrder, pulseScale, scramble, wordMotion } from "./effects.ts";

const AREA = { width: 400, height: 500 };
const WORD = { width: 160, height: 40 };
const set = (...ids: ModifierId[]): ReadonlySet<ModifierId> => new Set(ids);

describe("scrambled letters", () => {
    it("are always a different order of the same letters", () => {
        for (const word of ["RED", "GREEN", "BLUE", "YELLOW", "PURPLE", "CYAN"]) {
            for (let elapsed = 0; elapsed < 20000; elapsed += 97) {
                const scrambled = scramble(word, 0.42, elapsed);

                expect(scrambled).not.toBe(word);
                expect([...scrambled].sort()).toEqual([...word].sort());
            }
        }
    });

    it("change over time and stay put within one step", () => {
        const orders = new Set(Array.from({ length: 30 }, (_, i) => letterOrder(6, 0.1, i * 380).join()));

        expect(orders.size).toBeGreaterThan(5);
        expect(letterOrder(6, 0.1, 0)).toEqual(letterOrder(6, 0.1, 379));
    });
});

describe("word motion", () => {
    it("keeps a moving word inside the free area", () => {
        for (let elapsed = 0; elapsed < 10000; elapsed += 37) {
            const { x, y } = wordMotion(set("moving"), 0.3, elapsed, AREA, WORD);

            expect(Math.abs(x)).toBeLessThanOrEqual((AREA.width - WORD.width) / 2);
            expect(Math.abs(y)).toBeLessThanOrEqual((AREA.height - WORD.height) / 2);
        }
    });

    it("keeps a moving and shaking word inside the free area", () => {
        for (let elapsed = 0; elapsed < 10000; elapsed += 23) {
            const { x, y } = wordMotion(set("moving", "shaky"), 0.8, elapsed, AREA, WORD);

            expect(Math.abs(x)).toBeLessThanOrEqual((AREA.width - WORD.width) / 2);
            expect(Math.abs(y)).toBeLessThanOrEqual((AREA.height - WORD.height) / 2);
        }
    });

    it("travels across the whole area while moving", () => {
        const xs = Array.from({ length: 300 }, (_, i) => wordMotion(set("moving"), 0.3, i * 20, AREA, WORD).x);

        expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(AREA.width - WORD.width - 40);
    });

    it("shakes in small steps around the center", () => {
        const offsets = Array.from({ length: 50 }, (_, i) => wordMotion(set("shaky"), 0.7, i * 45, AREA, WORD));

        expect(new Set(offsets.map((offset) => offset.x)).size).toBeGreaterThan(40);
        for (const { x, y } of offsets) {
            expect(Math.abs(x)).toBeLessThanOrEqual(AREA.width * 0.035);
            expect(Math.abs(y)).toBeLessThanOrEqual(AREA.height * 0.1);
        }
    });

    it("pulses between 70 % and 114 %", () => {
        const scales = Array.from({ length: 100 }, (_, i) => pulseScale(0.5, i * 13));

        expect(Math.min(...scales)).toBeGreaterThanOrEqual(0.7 - 1e-9);
        expect(Math.max(...scales)).toBeLessThanOrEqual(1.14 + 1e-9);
        expect(Math.max(...scales) - Math.min(...scales)).toBeGreaterThan(0.4);
    });

    it("leaves the word alone without these modifiers", () => {
        expect(wordMotion(set("blur", "rotation"), 0.5, 1234, AREA, WORD)).toEqual({ x: 0, y: 0, scale: 1 });
        expect(effectFontScale(set("blur"))).toBe(1);
        expect(effectFontScale(set("moving", "pulsing"))).toBeLessThan(effectFontScale(set("moving")));
    });
});
