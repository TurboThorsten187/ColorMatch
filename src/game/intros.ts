import type { Color } from "./colors.ts";
import type { GameState } from "./game.ts";
import type { ModifierId } from "./modifiers.ts";

// One card per modifier, both mirrors share one
export type IntroId =
    "invertInput" | "noClick" | "spam" | "mirror" | "background" | "blink" | "blur" | "rotation" | "invertColors";

export interface ModifierIntro {
    readonly id: IntroId;
    readonly title: string;
    readonly modifiers: readonly ModifierId[];
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
        modifiers: ["invertInput"],
        example: { text: "BLUE", color: "blue" },
        lines: ["IT MATCHES, BUT...", "ANSWER THE *OPPOSITE*", "TAP RIGHT · FALSE"],
        accent: "red",
    },
    {
        id: "noClick",
        title: "DON'T CLICK",
        modifiers: ["noClick"],
        example: { text: "DON'T CLICK", color: "red" },
        lines: ["HANDS *OFF*!", "WAIT UNTIL", "THE TIMER RUNS OUT"],
        accent: "red",
    },
    {
        id: "spam",
        title: "SPAM",
        modifiers: ["spam"],
        example: { text: "SPAM!", color: "yellow" },
        lines: ["TAP *5 TIMES*,", "ANYWHERE, FAST"],
        accent: "yellow",
    },
    {
        id: "mirror",
        title: "MIRRORED",
        modifiers: ["mirrorVertical", "mirrorHorizontal"],
        example: { text: "GREEN", color: "green" },
        lines: ["THE WORD IS MIRRORED", "THE RULES STAY THE SAME"],
        accent: "yellow",
    },
    {
        id: "background",
        title: "BACKGROUND",
        modifiers: ["background"],
        example: { text: "RED", color: "blue" },
        lines: ["THE BACKGROUND", "TRIES TO FOOL YOU", "ONLY THE *TEXT COLOR* COUNTS"],
        accent: "yellow",
    },
    {
        id: "blink",
        title: "BLINK",
        modifiers: ["blink"],
        example: { text: "CYAN", color: "cyan" },
        lines: ["THE WORD VANISHES", "AFTER 0.5 S", "*REMEMBER IT*"],
        accent: "yellow",
    },
    {
        id: "blur",
        title: "BLURRED",
        modifiers: ["blur"],
        example: { text: "PURPLE", color: "purple" },
        lines: ["THE WORD IS BLURRED", "*LOOK CLOSELY*"],
        accent: "yellow",
    },
    {
        id: "rotation",
        title: "ROTATION",
        modifiers: ["rotation"],
        example: { text: "YELLOW", color: "yellow" },
        lines: ["THE WORD IS ROTATED", "THE RULES STAY THE SAME"],
        accent: "yellow",
    },
    {
        id: "invertColors",
        title: "INVERTED COLORS",
        modifiers: ["invertColors"],
        example: { text: "RED", color: "red" },
        lines: ["ALL COLORS ARE FLIPPED", "JUDGE THE *ORIGINAL* COLOR:"],
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
    return INTROS.filter(
        (intro) => !seen.includes(intro.id) && intro.modifiers.some((modifier) => modifiers.has(modifier)),
    ).map((intro) => intro.id);
}

// Cards are due when a level begins, not when a paused level continues or a SPAM! tap stays on the same level
export function introsForLevel(previous: GameState, next: GameState, seen: readonly IntroId[]): IntroId[] {
    const begins =
        next.phase === "playing" &&
        previous.phase !== "paused" &&
        (previous.phase !== "playing" || next.level > previous.level);
    return begins ? newIntros(next.challenge.modifiers, seen) : [];
}
