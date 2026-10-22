import type { ModifierGroup } from "@/modifiers/types.ts";

// The word spins, starting at an angle of its own on every level
export const rotation: ModifierGroup = {
    id: "rotation",
    tier: "easy",
    variants: ["rotation"],
    // Pseudo-random but stable per level, between -90 and +90 degrees
    decorate: (_challenge, { level }) => ({ rotationDeg: ((level * 53 + 19) % 181) - 90 }),
    intro: {
        title: "ROTATION",
        example: { word: "yellow", color: "yellow" },
        lines: ["THE WORD *SPINS*", "THE RULES STAY THE SAME"],
        accent: "yellow",
    },
    award: { code: "RO", name: "WHIRLWIND", levels: "ROTATED" },
};
