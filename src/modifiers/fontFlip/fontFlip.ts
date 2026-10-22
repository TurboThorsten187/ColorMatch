import type { ModifierGroup } from "@/modifiers/types.ts";

// Every letter keeps switching its font
export const fontFlip: ModifierGroup = {
    id: "fontFlip",
    tier: "medium",
    variants: ["fontFlip"],
    intro: {
        title: "FONT FLIP",
        example: { word: "purple", color: "purple" },
        lines: ["THE LETTERS *SWITCH FONTS*", "THE RULES STAY THE SAME"],
        accent: "yellow",
    },
    award: { code: "FF", name: "TYPOGRAPHER", levels: "FONT FLIP" },
};
