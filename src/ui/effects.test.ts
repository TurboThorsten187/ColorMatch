import { describe, expect, it } from "vitest";
import type { ModifierId } from "../game/modifiers.ts";
import {
    AFTERIMAGE_MS,
    ASSEMBLE_SHARE,
    afterimageOpacity,
    assembleRemaining,
    assembleStart,
    effectFontScale,
    fadeOpacity,
    flipFont,
    isNegative,
    lowTimeGlow,
    toAnchor,
    letterOrder,
    pulseRange,
    pulseScale,
    shakeTiltDeg,
    scramble,
    scrambleWords,
    spin,
    wordMotion,
} from "./effects.ts";

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

    it("mix a rule text word by word and keep its words apart", () => {
        for (const text of ["DON'T CLICK", "INVERTED INPUT"]) {
            const words = text.split(" ");
            for (let elapsed = 0; elapsed < 20000; elapsed += 97) {
                const scrambled = scrambleWords(text, 0.42, elapsed).split(" ");

                expect(scrambled).toHaveLength(words.length);
                scrambled.forEach((word, index) => {
                    expect(word).not.toBe(words[index]);
                    expect([...word].sort()).toEqual([...words[index]].sort());
                });
            }
        }
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

    it("shakes and tilts in small steps around the center", () => {
        const offsets = Array.from({ length: 50 }, (_, i) => wordMotion(set("shaky"), 0.7, i * 60, AREA, WORD));

        expect(new Set(offsets.map((offset) => offset.x)).size).toBeGreaterThan(40);
        expect(new Set(offsets.map((offset) => offset.rotation)).size).toBeGreaterThan(40);
        for (const { x, y, rotation } of offsets) {
            expect(Math.abs(x)).toBeLessThanOrEqual(AREA.width * 0.02);
            expect(Math.abs(y)).toBeLessThanOrEqual(AREA.height * 0.05);
            expect(Math.abs(rotation)).toBeLessThanOrEqual(shakeTiltDeg(0));
        }
    });

    it("shakes and tilts further the stronger it is, at most 1.5 times as far", () => {
        const shaky = set("shaky");
        const reach = (strength: number, pick: (motion: { x: number; rotation: number }) => number): number =>
            Math.max(
                ...Array.from({ length: 50 }, (_, i) =>
                    Math.abs(pick(wordMotion(shaky, 0.7, i * 60, AREA, WORD, {}, 1, { shaky: strength }))),
                ),
            );

        expect(reach(1, (motion) => motion.x)).toBeCloseTo(1.5 * reach(0, (motion) => motion.x));
        expect(reach(1, (motion) => motion.rotation)).toBeGreaterThan(reach(0, (motion) => motion.rotation));
        expect(shakeTiltDeg(0)).toBe(4);
        expect(shakeTiltDeg(1)).toBe(6);
        expect(effectFontScale(shaky, { shaky: 1 })).toBeLessThan(effectFontScale(shaky, { shaky: 0 }));
    });

    it("spins a full turn in 2.5 s, the direction depends on the level", () => {
        expect(spin(0.2, 0)).toBe(0);
        expect(Math.abs(spin(0.2, 2500))).toBe(360);
        expect(Math.sign(spin(0.2, 100))).not.toBe(Math.sign(spin(0.8, 100)));
    });

    it("spins unevenly the stronger it is, but always forward, at most 1.5 times as fast and a full turn in 2.5 s on average", () => {
        const angles = Array.from({ length: 200 }, (_, i) => spin(0.2, i * 35, 1));
        const steps = angles.slice(1).map((angle, i) => angle - angles[i]);
        const average = (360 * 35) / 2500;

        expect(Math.min(...steps)).toBeGreaterThan(0);
        expect(Math.max(...steps)).toBeGreaterThan(1.4 * average);
        expect(Math.max(...steps)).toBeLessThanOrEqual(1.5 * average + 1e-9);
        expect(spin(0.2, 7000, 1)).toBeCloseTo(spin(0.2, 7000, 0));
    });

    it("moves, shakes and pulses faster with a higher tempo", () => {
        const modifiers = set("moving", "shaky", "pulsing");
        const tempo = { moving: 2, shaky: 2, pulsing: 2 };

        expect(wordMotion(modifiers, 0.4, 600, AREA, WORD, tempo)).toEqual(
            wordMotion(modifiers, 0.4, 1200, AREA, WORD),
        );
    });

    it("fades a blinking word out within 0.9 s", () => {
        expect(fadeOpacity(0)).toBe(1);
        expect(fadeOpacity(450)).toBeCloseTo(0.5);
        expect(fadeOpacity(900)).toBe(0);
        expect(fadeOpacity(5000)).toBe(0);
    });

    it("pulses between 85 % and 108 %, and 1.5 times as far from 100 % at full strength", () => {
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

    it("leaves the word alone without these modifiers", () => {
        expect(wordMotion(set("blur", "rotation"), 0.5, 1234, AREA, WORD)).toEqual({
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0,
        });
        expect(effectFontScale(set("blur"))).toBe(1);
        expect(effectFontScale(set("moving", "pulsing"))).toBeLessThan(effectFontScale(set("moving")));
    });
});

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

describe("font flip", () => {
    const EVEN = Array.from({ length: 28 }, () => 1);

    it("gives every letter a new font every 200 ms, never the same twice in a row", () => {
        for (let letter = 0; letter < 6; letter++) {
            const fonts = Array.from({ length: 30 }, (_, step) => flipFont(0.42, letter, step * 200 + 50, EVEN));

            fonts.forEach((font, step) => {
                expect(font).toBeGreaterThanOrEqual(0);
                expect(font).toBeLessThan(28);
                if (step > 0) expect(font).not.toBe(fonts[step - 1]);
            });
            expect(flipFont(0.42, letter, 199, EVEN)).toBe(fonts[0]);
        }
    });

    it("mixes the fonts of the letters", () => {
        const fonts = new Set(Array.from({ length: 6 }, (_, letter) => flipFont(0.42, letter, 0, EVEN)));

        expect(fonts.size).toBeGreaterThan(1);
    });

    it("picks every font as often as its weight says", () => {
        // Font 0 never, font 1 three times as often as each of the others
        const weights = [0, 3, 1, 1, 1];
        const counts = [0, 0, 0, 0, 0];
        for (let letter = 0; letter < 40; letter++) {
            for (let step = 0; step < 100; step++) counts[flipFont(0.42, letter, step * 200, weights)]++;
        }

        expect(counts[0]).toBe(0);
        expect(counts[1]).toBeGreaterThan(1.5 * Math.max(counts[2], counts[3], counts[4]));
    });
});

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

describe("anchor coordinates", () => {
    it("undo the anchor's translate, rotate and scale", () => {
        const anchor = { x: 30, y: -20, rotation: 35, scaleX: -0.8, scaleY: 1.1 };
        const local = toAnchor({ x: 120, y: 75 }, anchor);

        // Forward again, the way CSS applies translate(x, y) rotate() scale()
        const radians = (anchor.rotation * Math.PI) / 180;
        const sx = local.x * anchor.scaleX;
        const sy = local.y * anchor.scaleY;
        expect(anchor.x + sx * Math.cos(radians) - sy * Math.sin(radians)).toBeCloseTo(120);
        expect(anchor.y + sx * Math.sin(radians) + sy * Math.cos(radians)).toBeCloseTo(75);
    });

    it("leave a point alone without a transform", () => {
        expect(toAnchor({ x: 12, y: -7 }, { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 })).toEqual({ x: 12, y: -7 });
    });
});

describe("shaking a zoomed word", () => {
    it("shakes as much relative to its size as a normal word", () => {
        const shaky = set("shaky");
        const normal = wordMotion(shaky, 0.7, 300, AREA, WORD);
        const zoomed = wordMotion(shaky, 0.7, 300, AREA, WORD, {}, 0.2);

        expect(zoomed.x).toBeCloseTo(normal.x * 0.2);
        expect(zoomed.y).toBeCloseTo(normal.y * 0.2);
        expect(zoomed.rotation).toBe(normal.rotation);
    });
});
