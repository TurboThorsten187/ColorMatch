import type { ModifierGroup } from "@/modifiers/types.ts";

// The word shakes and tilts a little
export const shaky: ModifierGroup = {
    id: "shaky",
    tier: "easy",
    variants: ["shaky"],
    hidesShapes: true,
    intro: {
        title: "SHAKY",
        example: { word: "purple", color: "purple" },
        lines: ["THE WORD *SHAKES*", "THE RULES STAY THE SAME"],
        accent: "yellow",
    },
    award: { code: "SH", name: "STEADY HAND", levels: "SHAKY" },
};
