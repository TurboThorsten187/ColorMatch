import { beforeAll, describe, expect, it, vi } from "vitest";
import type { Challenge } from "@/core/challenge.ts";
import type { ModifierGroupId, ModifierId } from "@/modifiers/types.ts";
import {
    CARD,
    effectFontScale,
    type Moved,
    STAGE,
    toAnchor,
    type WordInput,
    wordFrame,
    wordMotion,
} from "./wordFrame.ts";

// Tests run without a DOM: every character is 0.8 font sizes wide
beforeAll(() => {
    vi.stubGlobal("document", {
        createElement: () => ({
            getContext: () => {
                const context = {
                    font: "",
                    measureText: (text: string) => ({
                        width: text.length * 0.8 * Number.parseFloat(context.font.split(" ")[1]),
                    }),
                };
                return context;
            },
        }),
    });
});

const AREA = { width: 400, height: 500 };
const WORD = { width: 160, height: 40 };
const BOX = { width: 1000, height: 600 };

const moved = (...ids: ModifierId[]): Moved => ({ modifiers: new Set(ids), seed: 0.7, tempo: {}, strength: {} });

function challenge(groups: ModifierGroupId[], modifiers: ModifierId[], changes: Partial<Challenge> = {}): Challenge {
    return {
        word: "red",
        color: "red",
        groups,
        modifiers: new Set(modifiers),
        expected: "true",
        presses: 1,
        lockedShare: 0,
        background: null,
        rotationDeg: 0,
        seed: 0.42,
        tempo: {},
        strength: {},
        second: null,
        size: 1,
        ...changes,
    };
}

function frame(drawn: Challenge, changes: Partial<WordInput> = {}) {
    return wordFrame({
        challenge: drawn,
        elapsed: 0,
        timeLimit: 2000,
        box: BOX,
        layout: STAGE,
        spamCount: 0,
        colorblind: false,
        signsSize: { width: 0, height: 0 },
        ...changes,
    });
}

describe("word frame", () => {
    it("draws a plain word in one piece at a quarter of the height, in the middle", () => {
        const plain = frame(challenge([], []));

        expect(plain.lines).toHaveLength(1);
        expect(plain.lines[0]).toMatchObject({ text: "RED", color: "red", letters: null });
        expect(Math.abs(plain.lines[0].offset)).toBe(0);
        expect(plain.fontSize).toBeCloseTo(BOX.height * 0.24);
        expect(plain.anchor).toEqual({ x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 });
        expect(plain.opacity).toBe(1);
        expect(plain.signs).toEqual([]);
    });

    it("shrinks a word to fit a narrow box", () => {
        const narrow = frame(challenge([], [], { word: "yellow" }), { box: { width: 300, height: 600 } });

        expect(narrow.lines[0].width).toBeCloseTo(300 * 0.9);
    });

    it("keeps a card's word at least 40 px high where the box allows, and two words inside the box", () => {
        const low = { width: 400, height: 56 };
        const duo = challenge(["twoWords"], ["twoWords"], { second: { word: "blue", color: "green" } });

        expect(frame(challenge([], []), { box: low, layout: CARD }).fontSize).toBe(40);
        const two = frame(duo, { box: low, layout: CARD });
        expect(two.lines[1].offset + two.fontSize / 2).toBeLessThanOrEqual(low.height / 2 + 1e-9);
    });

    it("never draws a zoomed word below 10 px", () => {
        const zoomed = frame(challenge(["zoom"], ["zoom"], { size: 0.01 }));

        expect(zoomed.fontSize).toBe(10);
    });

    it("puts DUO's two words above and below the middle, each in its own ink", () => {
        const duo = frame(challenge(["twoWords"], ["twoWords"], { second: { word: "blue", color: "green" } }));

        expect(duo.lines.map((line) => line.text)).toEqual(["RED", "BLUE"]);
        expect(duo.lines.map((line) => line.color)).toEqual(["red", "green"]);
        expect(duo.lines[0].offset).toBeLessThan(0);
        expect(duo.lines[1].offset).toBe(-duo.lines[0].offset);
        expect(duo.lines[0].seed).not.toBe(duo.lines[1].seed);
    });

    it("fits a rotating word in every direction on the stage, a card cuts it off instead", () => {
        const turning = challenge(["rotation"], ["rotation"], { word: "yellow" });

        expect(frame(turning).lines[0].width).toBeCloseTo(BOX.height * 0.9);
        expect(frame(turning, { layout: CARD }).lines[0].width).toBeGreaterThan(BOX.height);
    });

    it("draws letter by letter only for FONT FLIP, ASSEMBLE and SPAM!", () => {
        expect(frame(challenge(["blur"], ["blur"])).lines[0].letters).toBeNull();
        for (const id of ["fontFlip", "assemble", "spam"] as const) {
            expect(frame(challenge([id], [id])).lines[0].letters, id).not.toBeNull();
        }
    });

    it("lights up SPAM! press by press, in plain ink even in the colorblind mode", () => {
        const spam = frame(challenge(["spam"], ["spam"]), { spamCount: 2, colorblind: true });

        expect(spam.lines[0].text).toBe("SPAM!");
        expect(spam.lines[0].letters?.map((letter) => letter.dim)).toEqual([false, false, true, true, true]);
        expect(spam.shapes).toBe(false);
        expect(frame(challenge([], []), { colorblind: true }).shapes).toBe(true);
    });

    it("starts every ASSEMBLE letter outside the box and has them all in place at a quarter of the time", () => {
        const assembling = challenge(["assemble"], ["assemble"], { word: "purple" });
        const start = frame(assembling, { elapsed: 0 });
        let left = -start.lines[0].width / 2;
        for (const letter of start.lines[0].letters ?? []) {
            const x = left + letter.width / 2 + letter.x;
            left += letter.width;
            const outside = Math.abs(x) >= BOX.width / 2 - 1e-6 || Math.abs(letter.y) >= BOX.height / 2 - 1e-6;
            expect(outside).toBe(true);
        }

        const done = frame(assembling, { elapsed: 500 });
        expect(done.lines[0].letters?.every((letter) => letter.x === 0 && letter.y === 0)).toBe(true);
    });

    it("shows the rule signs above the word on the stage, mixed up with SCRAMBLED, none on a card", () => {
        const noClick = challenge(["noClick"], ["noClick"]);

        expect(frame(noClick).signs.map((sign) => sign.text)).toEqual(["DON'T CLICK"]);
        expect(frame(noClick).signsBottom).toBeLessThan(0);
        expect(frame(noClick, { layout: CARD }).signs).toEqual([]);

        const mixed = frame(challenge(["noClick", "scrambled"], ["noClick", "scrambled"]));
        expect(mixed.signs[0].text).not.toBe("DON'T CLICK");
        expect([...mixed.signs[0].text].sort()).toEqual([..."DON'T CLICK"].sort());
    });

    it("fades, blurs, mirrors and leaves an afterimage for its modifiers", () => {
        expect(frame(challenge(["blink"], ["blink"]), { elapsed: 450 }).opacity).toBeCloseTo(0.5);
        expect(frame(challenge(["blur"], ["blur"])).blur).toBe(6);
        expect(frame(challenge(["blur"], ["blur"]), { layout: CARD }).blur).toBeCloseTo(4);
        expect(frame(challenge(["mirror"], ["mirrorBoth"])).anchor).toMatchObject({ scaleX: -1, scaleY: -1 });
        expect(frame(challenge(["negative"], ["negative"]), { elapsed: 1000 }).afterimage).toBe(1);
        expect(frame(challenge([], []), { elapsed: 1000 }).afterimage).toBe(0);
    });
});

describe("word motion", () => {
    it("keeps a moving and shaking word inside the free area", () => {
        for (let elapsed = 0; elapsed < 10000; elapsed += 23) {
            const { x, y } = wordMotion(moved("moving", "shaky"), elapsed, AREA, WORD);

            expect(Math.abs(x)).toBeLessThanOrEqual((AREA.width - WORD.width) / 2);
            expect(Math.abs(y)).toBeLessThanOrEqual((AREA.height - WORD.height) / 2);
        }
    });

    it("moves, shakes and pulses faster with a higher tempo", () => {
        const fast = { ...moved("moving", "shaky", "pulsing"), tempo: { moving: 2, shaky: 2, pulsing: 2 } };

        expect(wordMotion(fast, 600, AREA, WORD)).toEqual(
            wordMotion(moved("moving", "shaky", "pulsing"), 1200, AREA, WORD),
        );
    });

    it("shakes a zoomed word as much relative to its size as a normal word", () => {
        const normal = wordMotion(moved("shaky"), 300, AREA, WORD);
        const zoomed = wordMotion(moved("shaky"), 300, AREA, WORD, 0.2);

        expect(zoomed.x).toBeCloseTo(normal.x * 0.2);
        expect(zoomed.y).toBeCloseTo(normal.y * 0.2);
        expect(zoomed.rotation).toBe(normal.rotation);
    });

    it("leaves the word alone without these modifiers", () => {
        expect(wordMotion(moved("blur", "rotation"), 1234, AREA, WORD)).toEqual({ x: 0, y: 0, scale: 1, rotation: 0 });
        expect(effectFontScale(moved("blur"))).toBe(1);
        expect(effectFontScale(moved("moving", "pulsing"))).toBeLessThan(effectFontScale(moved("moving")));
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
