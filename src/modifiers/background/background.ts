import { COLORS } from "@/core/colors.ts";
import { pick } from "@/core/random.ts";
import type { ModifierGroup } from "@/modifiers/types.ts";

// A colored background tries to fool the player
export const background: ModifierGroup = {
    id: "background",
    tier: "medium",
    variants: ["background"],
    // Never the ink of a word, or that word would vanish; so it says nothing about the answer either
    decorate: (challenge, _level, rng) => ({
        background: pick(
            rng,
            COLORS.filter((color) => color !== challenge.color && color !== challenge.second?.color),
        ),
    }),
    intro: {
        title: "BACKGROUND",
        example: { word: "red", color: "blue" },
        // The background shows what the word says, to fool the player
        demo: { challenge: { background: "red" } },
        lines: ["THE BACKGROUND", "TRIES TO FOOL YOU", "ONLY THE *TEXT COLOR* COUNTS"],
        colorblindLines: ["THE BACKGROUND", "TRIES TO FOOL YOU", "ONLY THE *TEXT SHAPES* COUNT"],
        accent: "yellow",
    },
    award: { code: "BG", name: "UNFOOLED", levels: "BACKGROUND" },
};
