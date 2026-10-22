import { pick } from "@/core/random.ts";
import type { ModifierGroup, ModifierId } from "@/modifiers/types.ts";

// SYMMETRY looks the same mirrored left to right, so with it only the upside-down mirror changes anything
const SYMMETRY_MIRRORS: readonly ModifierId[] = ["mirrorVertical"];

// The word is mirrored up and down, left and right, or both: then it stands on its head
export const mirror: ModifierGroup = {
    id: "mirror",
    tier: "easy",
    variants: ["mirrorVertical", "mirrorHorizontal", "mirrorBoth"],
    pickVariant: (groups, rng) => pick(rng, groups.includes("splitMirror") ? SYMMETRY_MIRRORS : mirror.variants),
    intro: {
        title: "MIRRORED",
        example: { word: "green", color: "green" },
        lines: ["THE WORD IS MIRRORED", "THE RULES STAY THE SAME"],
        accent: "yellow",
    },
    award: { code: "MR", name: "MIRROR MIND", levels: "MIRRORED" },
};
