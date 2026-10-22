import type { ModifierGroup } from "@/modifiers/types.ts";

// REVERSE TIMER: the timer fills up instead of running down
export const countUp: ModifierGroup = {
    id: "countUp",
    tier: "easy",
    variants: ["countUp"],
    intro: {
        title: "REVERSE TIMER",
        example: { word: "green", color: "green" },
        lines: ["THE TIMER *FILLS UP*", "TIME IS UP WHEN IT IS FULL"],
        accent: "yellow",
    },
    award: { code: "RT", name: "TIME BENDER", levels: "REVERSE TIMER" },
};
