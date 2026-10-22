import type { Mode } from "@/core/progression.ts";
import type { ModifierGroup } from "@/modifiers/types.ts";

// The zoomed word starts at a fifth of the normal size and shrinks with every level after its introduction, down to
// a tenth; hardcore has it at its smallest
export const ZOOM_SIZE = 0.2;
export const ZOOM_MIN_SIZE = 0.1;
const ZOOM_SHRINK_PER_LEVEL = 0.04;

export function zoomSizeFor(level: number, introducedOn: number, mode: Mode = "normal"): number {
    if (mode === "hardcore") return ZOOM_MIN_SIZE;
    const shrink = 1 - ZOOM_SHRINK_PER_LEVEL * Math.max(0, level - introducedOn);
    return Math.max(ZOOM_MIN_SIZE, ZOOM_SIZE * shrink);
}

// The word is tiny
export const zoom: ModifierGroup = {
    id: "zoom",
    tier: "easy",
    variants: ["zoom"],
    // A tiny word blurred is only a smudge
    conflictsWith: ["blur"],
    hidesShapes: true,
    decorate: (_challenge, { level, introducedOn, mode }) => ({ size: zoomSizeFor(level, introducedOn("zoom"), mode) }),
    intro: {
        title: "ZOOM",
        example: { word: "cyan", color: "cyan" },
        // Tiny, but still readable on the card
        demo: { challenge: { size: 0.3 } },
        lines: ["THE WORD IS *TINY*", "THE RULES STAY THE SAME"],
        accent: "yellow",
    },
    award: { code: "ZM", name: "EAGLE EYE", levels: "ZOOMED" },
};
