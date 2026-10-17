import type { Color } from "./colors.ts";
import type { GameState } from "./game.ts";
import { groupsOf, type ModifierGroupId, type ModifierId } from "./modifiers.ts";

// One card per modifier group, both mirrors share one
export type IntroId = ModifierGroupId;

export interface ModifierIntro {
    readonly id: IntroId;
    readonly title: string;
    // Shown on the card with the modifier's effect applied
    readonly example: { readonly text: string; readonly color: Color };
    // Words between * are highlighted in the accent color
    readonly lines: readonly string[];
    readonly accent: Color;
}

export const INTROS: readonly ModifierIntro[] = [
    {
        id: "invertInput",
        title: "INVERTED INPUT",
        example: { text: "BLUE", color: "blue" },
        lines: ["IT MATCHES, BUT...", "ANSWER THE *OPPOSITE*", "TAP RIGHT · FALSE"],
        accent: "red",
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
        example: { text: "SPAM!", color: "yellow" },
        lines: ["TAP *5 TIMES*,", "ANYWHERE, FAST"],
        accent: "yellow",
    },
    {
        id: "mirror",
        title: "MIRRORED",
        example: { text: "GREEN", color: "green" },
        lines: ["THE WORD IS MIRRORED", "THE RULES STAY THE SAME"],
        accent: "yellow",
    },
    {
        id: "background",
        title: "BACKGROUND",
        example: { text: "RED", color: "blue" },
        lines: ["THE BACKGROUND", "TRIES TO FOOL YOU", "ONLY THE *TEXT COLOR* COUNTS"],
        accent: "yellow",
    },
    {
        id: "blink",
        title: "BLINK",
        example: { text: "CYAN", color: "cyan" },
        lines: ["THE WORD VANISHES", "AFTER 0.5 S", "*REMEMBER IT*"],
        accent: "yellow",
    },
    {
        id: "blur",
        title: "BLURRED",
        example: { text: "PURPLE", color: "purple" },
        lines: ["THE WORD IS BLURRED", "*LOOK CLOSELY*"],
        accent: "yellow",
    },
    {
        id: "rotation",
        title: "ROTATION",
        example: { text: "YELLOW", color: "yellow" },
        lines: ["THE WORD IS ROTATED", "THE RULES STAY THE SAME"],
        accent: "yellow",
    },
    {
        id: "moving",
        title: "MOVING",
        example: { text: "GREEN", color: "green" },
        lines: ["THE WORD *MOVES AROUND*", "THE RULES STAY THE SAME"],
        accent: "yellow",
    },
    {
        id: "scrambled",
        title: "SCRAMBLED",
        example: { text: "BLUE", color: "blue" },
        lines: ["THE LETTERS ARE *MIXED UP*", "READ THE WORD ANYWAY"],
        accent: "yellow",
    },
    {
        id: "shaky",
        title: "SHAKY",
        example: { text: "PURPLE", color: "purple" },
        lines: ["THE WORD *SHAKES*", "THE RULES STAY THE SAME"],
        accent: "yellow",
    },
    {
        id: "pulsing",
        title: "PULSING",
        example: { text: "RED", color: "red" },
        lines: ["THE WORD *PULSES*", "THE RULES STAY THE SAME"],
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
