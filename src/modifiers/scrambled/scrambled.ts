import type { ModifierGroup } from "@/modifiers/types.ts";

// The letters keep changing their order
export const scrambled: ModifierGroup = {
    id: "scrambled",
    tier: "hard",
    variants: ["scrambled"],
    intro: {
        title: "SCRAMBLED",
        example: { word: "blue", color: "blue" },
        lines: ["THE LETTERS ARE *MIXED UP*", "READ THE WORD ANYWAY"],
        accent: "yellow",
    },
    award: { code: "SC", name: "WORDSMITH", levels: "SCRAMBLED" },
};
