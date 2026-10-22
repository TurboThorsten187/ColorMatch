import type { ModifierGroup } from "@/modifiers/types.ts";

// The letters fly in from the screen edges
export const assemble: ModifierGroup = {
    id: "assemble",
    tier: "medium",
    variants: ["assemble"],
    // The word would fade before its letters have arrived
    conflictsWith: ["blink"],
    intro: {
        title: "ASSEMBLE",
        example: { word: "yellow", color: "yellow" },
        lines: ["THE LETTERS *FLY IN*", "THE RULES STAY THE SAME"],
        accent: "yellow",
    },
    award: { code: "AS", name: "ARCHITECT", levels: "ASSEMBLE" },
};
