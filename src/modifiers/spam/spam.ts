import type { ModifierGroup } from "@/modifiers/types.ts";

// Shown instead of a color word, one character lights up per press
export const SPAM_WORD = "SPAM!";
export const SPAM_PRESSES_NEEDED = 5;

// Press five times, anywhere; then the game pauses a moment (the spamPause phase) so further presses go nowhere
export const spam: ModifierGroup = {
    id: "spam",
    tier: "medium",
    variants: ["spam"],
    // SPAM! replaces the word, so nothing that is about the word or its color makes sense with it
    conflictsWith: ["background", "blink", "scrambled", "splitMirror"],
    rule: { expect: () => "spam", presses: SPAM_PRESSES_NEEDED },
    intro: {
        title: "SPAM",
        example: { text: SPAM_WORD, color: "yellow" },
        lines: ["TAP *5 TIMES*,", "ANYWHERE, FAST"],
        accent: "yellow",
    },
    award: { code: "SP", name: "RAPID FIRE", levels: "SPAM" },
};
