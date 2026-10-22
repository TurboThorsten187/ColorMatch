import type { ModifierGroup } from "@/modifiers/types.ts";

// The word grows and shrinks quickly
export const pulsing: ModifierGroup = {
    id: "pulsing",
    tier: "easy",
    variants: ["pulsing"],
    intro: {
        title: "PULSING",
        example: { word: "red", color: "red" },
        lines: ["THE WORD *PULSES*", "THE RULES STAY THE SAME"],
        accent: "yellow",
    },
    award: { code: "PU", name: "HEARTBEAT", levels: "PULSING" },
};
