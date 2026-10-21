import type { ColorWord } from "./challenge.ts";
import type { Color } from "./colors.ts";
import type { GameState } from "./game.ts";
import { groupsOf, type ModifierGroupId, type ModifierId } from "./modifiers.ts";

// One card per modifier group, both mirrors share one
export type IntroId = ModifierGroupId;

export interface ModifierIntro {
    readonly id: IntroId;
    readonly title: string;
    // Shown on the card with the modifier's effect applied: a color word, which the colorblind mode shows as a shape
    // word, or a fixed text
    readonly example: ColorWord | { readonly text: string; readonly color: Color };
    // A second color word below the example, for the two words modifier
    readonly second?: ColorWord;
    // Words between * are highlighted in the accent color; on a rule card it is the rule's color from signs.ts
    readonly lines: readonly string[];
    // Replaces `lines` in the colorblind mode where they talk about colors
    readonly colorblindLines?: readonly string[];
    // Replaces `lines` when FLIP CONTROLS puts TRUE on the right, where they name a side
    readonly flippedLines?: readonly string[];
    readonly accent: Color;
}

export const INTROS: readonly ModifierIntro[] = [
    {
        id: "invertInput",
        title: "INVERTED INPUT",
        example: { word: "blue", color: "blue" },
        lines: ["IT MATCHES, BUT...", "ANSWER THE *OPPOSITE*", "TAP RIGHT · FALSE"],
        flippedLines: ["IT MATCHES, BUT...", "ANSWER THE *OPPOSITE*", "TAP LEFT · FALSE"],
        accent: "purple",
    },
    {
        id: "noClick",
        title: "DON'T CLICK",
        example: { text: "DON'T CLICK", color: "red" },
        lines: ["HANDS *OFF*!", "WAIT UNTIL", "THE TIMER RUNS OUT"],
        accent: "red",
    },
    {
        id: "spam",
        title: "SPAM",
        example: { text: "SPAM!", color: "blue" },
        lines: ["TAP *5 TIMES*,", "ANYWHERE, FAST"],
        accent: "blue",
    },
    {
        id: "mirror",
        title: "MIRRORED",
        example: { word: "green", color: "green" },
        lines: ["THE WORD IS MIRRORED", "THE RULES STAY THE SAME"],
        accent: "yellow",
    },
    {
        id: "background",
        title: "BACKGROUND",
        example: { word: "red", color: "blue" },
        lines: ["THE BACKGROUND", "TRIES TO FOOL YOU", "ONLY THE *TEXT COLOR* COUNTS"],
        colorblindLines: ["THE BACKGROUND", "TRIES TO FOOL YOU", "ONLY THE *TEXT SHAPES* COUNT"],
        accent: "yellow",
    },
    {
        id: "blink",
        title: "FADE",
        example: { word: "cyan", color: "cyan" },
        lines: ["THE WORD FADES AWAY", "IN UNDER A SECOND", "*REMEMBER IT*"],
        accent: "yellow",
    },
    {
        id: "blur",
        title: "BLURRED",
        example: { word: "purple", color: "purple" },
        lines: ["THE WORD IS BLURRED", "*LOOK CLOSELY*"],
        accent: "yellow",
    },
    {
        id: "rotation",
        title: "ROTATION",
        example: { word: "yellow", color: "yellow" },
        lines: ["THE WORD *SPINS*", "THE RULES STAY THE SAME"],
        accent: "yellow",
    },
    {
        id: "moving",
        title: "MOVING",
        example: { word: "green", color: "green" },
        lines: ["THE WORD *MOVES AROUND*", "THE RULES STAY THE SAME"],
        accent: "yellow",
    },
    {
        id: "scrambled",
        title: "SCRAMBLED",
        example: { word: "blue", color: "blue" },
        lines: ["THE LETTERS ARE *MIXED UP*", "READ THE WORD ANYWAY"],
        accent: "yellow",
    },
    {
        id: "shaky",
        title: "SHAKY",
        example: { word: "purple", color: "purple" },
        lines: ["THE WORD *SHAKES*", "THE RULES STAY THE SAME"],
        accent: "yellow",
    },
    {
        id: "pulsing",
        title: "PULSING",
        example: { word: "red", color: "red" },
        lines: ["THE WORD *PULSES*", "THE RULES STAY THE SAME"],
        accent: "yellow",
    },
    {
        id: "zoom",
        title: "ZOOM",
        example: { word: "cyan", color: "cyan" },
        lines: ["THE WORD IS *TINY*", "THE RULES STAY THE SAME"],
        accent: "yellow",
    },
    {
        id: "splitMirror",
        title: "SYMMETRY",
        example: { word: "cyan", color: "cyan" },
        lines: ["ONLY THE *LEFT HALF* IS THERE", "THE RIGHT HALF MIRRORS IT"],
        accent: "yellow",
    },
    {
        id: "countUp",
        title: "REVERSE TIMER",
        example: { word: "green", color: "green" },
        lines: ["THE TIMER *FILLS UP*", "TIME IS UP WHEN IT IS FULL"],
        accent: "yellow",
    },
    {
        id: "assemble",
        title: "ASSEMBLE",
        example: { word: "yellow", color: "yellow" },
        lines: ["THE LETTERS *FLY IN*", "THE RULES STAY THE SAME"],
        accent: "yellow",
    },
    {
        id: "fontFlip",
        title: "FONT FLIP",
        example: { word: "purple", color: "purple" },
        lines: ["THE LETTERS *SWITCH FONTS*", "THE RULES STAY THE SAME"],
        accent: "yellow",
    },
    {
        id: "negative",
        title: "NEGATIVE",
        example: { word: "red", color: "red" },
        lines: ["THE SCREEN FLASHES", "AS A *NEGATIVE*", "ONLY THE REAL COLOR COUNTS"],
        colorblindLines: ["THE SCREEN FLASHES", "AS A *NEGATIVE*", "THE RULES STAY THE SAME"],
        accent: "yellow",
    },
    {
        id: "wait",
        title: "WAIT",
        example: { text: "WAIT", color: "red" },
        lines: ["ANSWER ONLY", "ONCE IT SAYS *NOW*", "EARLIER IS A MISS"],
        accent: "green",
    },
    {
        id: "doubleTap",
        title: "DOUBLE TAP",
        example: { text: "DOUBLE TAP", color: "red" },
        lines: ["TAP YOUR ANSWER *TWICE*", "ONE WRONG TAP IS A MISS"],
        accent: "cyan",
    },
    {
        id: "twoWords",
        title: "DUO",
        example: { word: "green", color: "green" },
        second: { word: "red", color: "blue" },
        lines: ["TRUE IF *BOTH OR NEITHER*", "OF THE WORDS MATCH"],
        accent: "yellow",
    },
];

export function introById(id: IntroId): ModifierIntro {
    const intro = INTROS.find((candidate) => candidate.id === id);
    if (!intro) throw new Error(`Intro ${id} is missing in INTROS`);
    return intro;
}

// The cards a level needs before it starts, each one only the first time its modifier shows up
export function newIntros(modifiers: ReadonlySet<ModifierId>, seen: readonly IntroId[]): IntroId[] {
    return groupsOf(modifiers).filter((id) => !seen.includes(id));
}

// Cards are due when a level begins, not when a paused level continues or a SPAM! tap stays on the same level
export function introsForLevel(previous: GameState, next: GameState, seen: readonly IntroId[]): IntroId[] {
    const begins =
        next.phase === "playing" &&
        previous.phase !== "paused" &&
        (previous.phase !== "playing" || next.level > previous.level);
    return begins ? newIntros(next.challenge.modifiers, seen) : [];
}
