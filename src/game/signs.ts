import { type Color, COLOR_CSS } from "./colors.ts";
import type { ModifierGroupId } from "./modifiers.ts";

// Every rule shows in a color of its own: the rules below with a sign above the word, SPAM! with its characters. WAIT
// is the only one in white, which no ink has.
export type SignColor = Color | "white";

export type SignedRule = Extract<ModifierGroupId, "noClick" | "invertInput" | "wait" | "doubleTap" | "twoWords">;

export interface Sign {
    readonly text: string;
    readonly color: SignColor;
}

export const SIGNS: Readonly<Record<SignedRule, Sign>> = {
    noClick: { text: "DON'T CLICK", color: "red" },
    invertInput: { text: "INVERTED INPUT", color: "purple" },
    wait: { text: "WAIT", color: "white" },
    doubleTap: { text: "DOUBLE TAP", color: "cyan" },
    twoWords: { text: "BOTH OR NEITHER", color: "yellow" },
};

// WAIT's sign says NOW once an answer counts, green like a traffic light
export const NOW_SIGN: Sign = { text: "NOW", color: "green" };

// The characters of SPAM! light up in this color, whatever ink the level drew
export const SPAM_COLOR: Color = "blue";

export const SIGN_CSS: Readonly<Record<SignColor, string>> = { ...COLOR_CSS, white: "#fff" };

export function isSignedRule(id: ModifierGroupId): id is SignedRule {
    return id in SIGNS;
}
