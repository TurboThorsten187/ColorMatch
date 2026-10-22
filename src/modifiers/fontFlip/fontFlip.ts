import type { ModifierGroup } from "@/modifiers/types.ts";

// Every letter keeps switching its font
export const fontFlip: ModifierGroup = {
    id: "fontFlip",
    tier: "medium",
    variants: ["fontFlip"],
    intro: {
        title: "FONT FLIP",
        example: { word: "purple", color: "purple" },
        // Starts over now and then, so a card left open does not count up ever more font steps
        demo: { loopMs: 4000 },
        lines: ["THE LETTERS *SWITCH FONTS*", "THE RULES STAY THE SAME"],
        accent: "yellow",
    },
    award: { code: "FF", name: "TYPOGRAPHER", levels: "FONT FLIP" },
};
