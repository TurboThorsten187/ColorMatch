import type { Answer, Challenge, ColorWord, ExpectedInput } from "@/core/challenge.ts";
import type { Color } from "@/core/colors.ts";
import type { Mode } from "@/core/progression.ts";
import type { Rng } from "@/core/random.ts";

// What makes up a modifier group: everything a level, its intro card, its award and its rule sign need to know about
// it. Every group has a folder of its own with its definition; registry.ts lists them. Definitions import nothing from
// src/core but types and the leaf modules colors.ts and random.ts, so the game can import them.

export type ModifierId =
    // Change which input is correct
    | "invertInput"
    | "noClick"
    | "spam"
    // Two words, the answer says whether both are true or both false
    | "twoWords"
    // A press before the WAIT sign turns into NOW is a miss
    | "wait"
    // The answer needs two taps
    | "doubleTap"
    // Only change how the challenge looks
    | "mirrorVertical"
    | "mirrorHorizontal"
    // Both mirrors at once: the word stands on its head
    | "mirrorBoth"
    | "background"
    | "blink"
    | "blur"
    | "rotation"
    | "moving"
    | "scrambled"
    | "shaky"
    | "pulsing"
    // The left half of the word, mirrored onto its right half
    | "splitMirror"
    // The letters fly in from the screen edges
    | "assemble"
    // Every letter keeps switching its font
    | "fontFlip"
    // The word is tiny
    | "zoom"
    // The timer fills up instead of running down
    | "countUp"
    // The whole screen flashes as its photo negative
    | "negative";

// Modifiers are introduced, picked and explained per group; both mirrors form one group. The ids stay for saved
// stats, the names players see are the intro titles (blink is FADE, splitMirror SYMMETRY, countUp REVERSE TIMER,
// twoWords DUO).
export type ModifierGroupId =
    | "mirror"
    | "rotation"
    | "pulsing"
    | "shaky"
    | "background"
    | "blur"
    | "moving"
    | "noClick"
    | "blink"
    | "scrambled"
    | "invertInput"
    | "spam"
    | "splitMirror"
    | "assemble"
    | "fontFlip"
    | "zoom"
    | "countUp"
    | "negative"
    | "twoWords"
    | "wait"
    | "doubleTap";

// Every game introduces all easy groups first, then the medium and then the hard ones; the harder the tier, the more
// extra time a group brings to a level
export type Tier = "easy" | "medium" | "hard";

export const TIERS: readonly Tier[] = ["easy", "medium", "hard"];

// A pixel icon of 7 × 7 pixels, rows of "#" (a pixel) and "."
export interface PixelIcon {
    readonly rows: readonly string[];
    // Points somewhere: the copy at the end of a sign is mirrored, so both face the text
    readonly directed: boolean;
}

// The sign a rule group puts above the word, with its icon at both ends, so a rule is told apart without reading it
export interface Sign {
    readonly text: string;
    readonly icon: PixelIcon;
}

// The card shown when the group comes up for the first time
export interface IntroCard {
    readonly title: string;
    // Shown with the modifier's effect: a color word, which the colorblind mode shows as a shape word, or a fixed text
    readonly example: ColorWord | { readonly text: string; readonly color: Color };
    // A second color word below the example, for DUO
    readonly second?: ColorWord;
    // Words between * are highlighted in the accent color
    readonly lines: readonly string[];
    // Replaces `lines` in the colorblind mode where they talk about colors
    readonly colorblindLines?: readonly string[];
    // Replaces `lines` when FLIP CONTROLS puts TRUE on the right, where they name a side
    readonly flippedLines?: readonly string[];
    readonly accent: Color;
}

// The award for clearing levels with the group: "BEAT 10 <levels> LEVELS", or another verb
export interface AwardText {
    // Two characters, shown on the badge
    readonly code: string;
    readonly name: string;
    readonly levels: string;
    readonly verb?: string;
}

// How a rule group changes what solves a level; a level has at most one rule group
export interface Rule {
    // The input the level asks for instead of the plain answer
    readonly expect?: (answer: Answer) => ExpectedInput;
    // Presses that solve the level: the right answer that many times, or with "spam" that many presses anywhere
    readonly presses?: number;
    // A press before this share of the time limit loses the level
    readonly lockedShare?: number;
    // The level gets only this share of its time limit
    readonly timeShare?: number;
}

// What a level knows when it adds a group's part to its challenge
export interface LevelContext {
    readonly level: number;
    readonly mode: Mode;
    // The level that introduced a group in this game
    readonly introducedOn: (id: ModifierGroupId) => number;
}

export interface ModifierGroup {
    readonly id: ModifierGroupId;
    readonly tier: Tier;
    // A level with this group gets one of these modifiers
    readonly variants: readonly ModifierId[];
    // Groups that must not share a level with this one; only one of two groups needs to name the other
    readonly conflictsWith?: readonly ModifierGroupId[];
    // Blurs, shrinks or shakes the shapes in the letters past recognition, so colorblind games leave the group out
    readonly hidesShapes?: boolean;
    // Changes which input is correct; at most one such group per level
    readonly rule?: Rule;
    // Time on top of the tier's extra time, on a surge too
    readonly extraTimeMs?: number;
    // The modifier the group brings to a level with these groups, any of `variants` without
    readonly pickVariant?: (groups: readonly ModifierGroupId[], rng: Rng) => ModifierId;
    // Changes the words of a level's challenge (DUO adds a second one)
    readonly words?: (challenge: Challenge, rng: Rng) => Partial<Challenge>;
    // Adds what depends on the final words, like a background in neither ink
    readonly decorate?: (challenge: Challenge, level: LevelContext, rng: Rng) => Partial<Challenge>;
    // The sign above the word at a share of the level's time
    readonly sign?: (share: number) => Sign;
    readonly intro: IntroCard;
    readonly award: AwardText;
}
