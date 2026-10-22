import type { ModifierGroup } from "@/modifiers/types.ts";

// A smaller word glides across the screen
export const moving: ModifierGroup = {
    id: "moving",
    tier: "medium",
    variants: ["moving"],
    hidesShapes: true,
    intro: {
        title: "MOVING",
        example: { word: "green", color: "green" },
        lines: ["THE WORD *MOVES AROUND*", "THE RULES STAY THE SAME"],
        accent: "yellow",
    },
    award: { code: "MV", name: "TRACKER", levels: "MOVING" },
};
