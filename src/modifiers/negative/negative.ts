import type { ModifierGroup } from "@/modifiers/types.ts";

// The whole screen flashes as its photo negative, then shows an afterimage
export const negative: ModifierGroup = {
    id: "negative",
    tier: "medium",
    variants: ["negative"],
    // The word would be gone before the negative is over, so it would show almost only in the wrong colors
    conflictsWith: ["blink"],
    intro: {
        title: "NEGATIVE",
        example: { word: "red", color: "red" },
        lines: ["THE SCREEN FLASHES", "AS A *NEGATIVE*", "ONLY THE REAL COLOR COUNTS"],
        colorblindLines: ["THE SCREEN FLASHES", "AS A *NEGATIVE*", "THE RULES STAY THE SAME"],
        accent: "yellow",
    },
    award: { code: "NG", name: "INVERTER", levels: "NEGATIVE" },
};
