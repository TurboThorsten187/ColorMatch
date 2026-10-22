import type { ModifierGroup, PixelIcon } from "@/modifiers/types.ts";

// Right taps the level needs, with no limit on the time between them
export const DOUBLE_TAPS = 2;

// Two dots, one per tap
const DOTS: PixelIcon = {
    rows: [".......", ".......", "###.###", "###.###", "###.###", ".......", "......."],
    directed: false,
};

// The answer has to be given twice; one wrong tap is a miss
export const doubleTap: ModifierGroup = {
    id: "doubleTap",
    tier: "hard",
    variants: ["doubleTap"],
    rule: { presses: DOUBLE_TAPS },
    sign: () => ({ text: "DOUBLE TAP", icon: DOTS }),
    intro: {
        title: "DOUBLE TAP",
        example: "sign",
        lines: ["TAP YOUR ANSWER *TWICE*", "ONE WRONG TAP IS A MISS"],
        accent: "red",
    },
    award: { code: "DT", name: "DOUBLE TROUBLE", levels: "DOUBLE TAP" },
};
