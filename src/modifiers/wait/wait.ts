import type { ModifierGroup, PixelIcon } from "@/modifiers/types.ts";

// The sign says WAIT for this share of the time limit, then NOW; a press before NOW is a miss
export const WAIT_SHARE = 0.4;

const PAUSE: PixelIcon = {
    rows: [".......", ".##.##.", ".##.##.", ".##.##.", ".##.##.", ".##.##.", "......."],
    directed: false,
};

const PLAY: PixelIcon = {
    rows: ["#......", "##.....", "###....", "####...", "###....", "##.....", "#......"],
    directed: true,
};

// Answer only once the sign turns from WAIT into NOW
export const wait: ModifierGroup = {
    id: "wait",
    tier: "hard",
    variants: ["wait"],
    // Fade fades the rule tags too, so NOW would never show
    conflictsWith: ["blink"],
    rule: { lockedShare: WAIT_SHARE },
    sign: (share) => (share < WAIT_SHARE ? { text: "WAIT", icon: PAUSE } : { text: "NOW", icon: PLAY }),
    intro: {
        title: "WAIT",
        example: { text: "WAIT", color: "red" },
        lines: ["ANSWER ONLY", "ONCE IT SAYS *NOW*", "EARLIER IS A MISS"],
        accent: "red",
    },
    award: { code: "WT", name: "PATIENCE", levels: "WAIT" },
};
