import type { ModifierGroup } from "@/modifiers/types.ts";

// FADE: the word fades away in under a second, the background stays
export const blink: ModifierGroup = {
    id: "blink",
    tier: "medium",
    variants: ["blink"],
    intro: {
        title: "FADE",
        example: { word: "cyan", color: "cyan" },
        lines: ["THE WORD FADES AWAY", "IN UNDER A SECOND", "*REMEMBER IT*"],
        accent: "yellow",
    },
    award: { code: "FD", name: "PHOTO MEMORY", levels: "FADE" },
};
