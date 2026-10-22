import type { ModifierGroup } from "@/modifiers/types.ts";

// The word is out of focus
export const blur: ModifierGroup = {
    id: "blur",
    tier: "medium",
    variants: ["blur"],
    hidesShapes: true,
    intro: {
        title: "BLURRED",
        example: { word: "purple", color: "purple" },
        lines: ["THE WORD IS BLURRED", "*LOOK CLOSELY*"],
        accent: "yellow",
    },
    award: { code: "BL", name: "SHARP EYES", levels: "BLURRED" },
};
