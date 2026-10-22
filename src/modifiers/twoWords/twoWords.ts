import { randomColor } from "@/core/colors.ts";
import type { ModifierGroup, PixelIcon } from "@/modifiers/types.ts";

// DUO has two words and two inks to read, it gets this on top of its extra time, on a surge too
export const DUO_EXTRA_MS = 1500;

// An equals sign: both words alike
const EQUALS: PixelIcon = {
    rows: [".......", "#######", "#######", ".......", "#######", "#######", "......."],
    directed: false,
};

// DUO: two words, one above the other; TRUE when both or neither match their ink
export const twoWords: ModifierGroup = {
    id: "twoWords",
    tier: "hard",
    variants: ["twoWords"],
    // Two words and two inks are too much to read before they fade
    conflictsWith: ["blink"],
    rule: {},
    extraTimeMs: DUO_EXTRA_MS,
    // The challenge's word tells the answer; the upper word's truth is drawn, the lower one follows from both
    words: (challenge, rng) => {
        const both = challenge.word === challenge.color;
        const upper = rng() < 0.5;
        const lower = both ? upper : !upper;
        const color = randomColor(rng);
        return {
            word: upper ? challenge.color : randomColor(rng, challenge.color),
            second: { word: lower ? color : randomColor(rng, color), color },
        };
    },
    sign: () => ({ text: "BOTH OR NEITHER", icon: EQUALS }),
    intro: {
        title: "DUO",
        example: { word: "green", color: "green" },
        demo: { challenge: { second: { word: "red", color: "blue" } } },
        lines: ["TRUE IF *BOTH OR NEITHER*", "OF THE WORDS MATCH"],
        accent: "red",
    },
    award: { code: "DU", name: "DOUBLE VISION", levels: "DUO" },
};
