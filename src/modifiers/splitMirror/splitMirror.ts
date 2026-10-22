import type { ModifierGroup } from "@/modifiers/types.ts";

// SYMMETRY: only the left half of the word is there, mirrored onto the right half
export const splitMirror: ModifierGroup = {
    id: "splitMirror",
    tier: "easy",
    variants: ["splitMirror"],
    // Half of a scrambled word is too few letters to recognize it
    conflictsWith: ["scrambled"],
    intro: {
        title: "SYMMETRY",
        example: { word: "cyan", color: "cyan" },
        lines: ["ONLY THE *LEFT HALF* IS THERE", "THE RIGHT HALF MIRRORS IT"],
        accent: "yellow",
    },
    award: { code: "SY", name: "HALF AND HALF", levels: "SYMMETRY" },
};
