import type { ModifierId } from "./modifiers.ts";

export type AwardId =
    | "level10"
    | "level25"
    | "level50"
    | "level100"
    | "surge"
    | "invertInput"
    | "noClick"
    | "spam"
    | "mirror"
    | "background"
    | "blink"
    | "blur"
    | "rotation"
    | "moving"
    | "scrambled"
    | "shaky"
    | "pulsing"
    | "zoom"
    | "splitMirror"
    | "countUp"
    | "assemble"
    | "fontFlip"
    | "negative"
    | "wait"
    | "doubleTap"
    | "twoWords";

// "rule" awards belong to modifiers that change the correct input, "look" awards to the visual ones
export type AwardKind = "milestone" | "surge" | "rule" | "look";

interface AwardBase {
    readonly id: AwardId;
    // Two or three characters, shown on the badge
    readonly code: string;
    readonly name: string;
    readonly rule: string;
}

export interface MilestoneAward extends AwardBase {
    readonly kind: "milestone";
    // Unlocked by clearing this level
    readonly level: number;
}

export interface ModifierAward extends AwardBase {
    readonly kind: "rule" | "look";
    // Clearing a level with any of these modifiers counts once
    readonly modifiers: readonly ModifierId[];
}

// Clearing a surge level counts once
export interface SurgeAward extends AwardBase {
    readonly kind: "surge";
}

export type Award = MilestoneAward | SurgeAward | ModifierAward;

// Levels with a modifier, or surge levels, that have to be cleared, summed up over all games
export const MODIFIER_CLEARS_NEEDED = 10;

function milestone(id: AwardId, level: number): MilestoneAward {
    return { id, code: String(level), name: `LEVEL ${level}`, rule: `CLEAR LEVEL ${level}`, kind: "milestone", level };
}

function modifierAward(
    id: AwardId,
    code: string,
    name: string,
    kind: ModifierAward["kind"],
    levels: string,
    modifiers: readonly ModifierId[],
    verb = "BEAT",
): ModifierAward {
    return { id, code, name, rule: `${verb} ${MODIFIER_CLEARS_NEEDED} ${levels} LEVELS`, kind, modifiers };
}

export const AWARDS: readonly Award[] = [
    milestone("level10", 10),
    milestone("level25", 25),
    milestone("level50", 50),
    milestone("level100", 100),
    {
        id: "surge",
        code: "SG",
        name: "SURGE",
        rule: `BEAT ${MODIFIER_CLEARS_NEEDED} SURGE LEVELS`,
        kind: "surge",
    },
    modifierAward("invertInput", "II", "TURNAROUND", "rule", "INVERTED INPUT", ["invertInput"]),
    modifierAward("noClick", "NC", "HANDS OFF", "rule", "DON'T CLICK", ["noClick"], "SIT OUT"),
    modifierAward("spam", "SP", "SPAM MASTER", "rule", "SPAM", ["spam"]),
    modifierAward("mirror", "MR", "MIRROR MIND", "look", "MIRRORED", [
        "mirrorVertical",
        "mirrorHorizontal",
        "mirrorBoth",
    ]),
    modifierAward("background", "BG", "NO LURE", "look", "BACKGROUND", ["background"]),
    modifierAward("blink", "BK", "BLINK", "look", "BLINK", ["blink"]),
    modifierAward("blur", "BL", "SHARP EYES", "look", "BLURRED", ["blur"]),
    modifierAward("rotation", "RO", "DIZZY", "look", "ROTATED", ["rotation"]),
    modifierAward("moving", "MV", "MOVING TARGET", "look", "MOVING", ["moving"]),
    modifierAward("scrambled", "SC", "UNSCRAMBLED", "look", "SCRAMBLED", ["scrambled"]),
    modifierAward("shaky", "SH", "STEADY HAND", "look", "SHAKY", ["shaky"]),
    modifierAward("pulsing", "PU", "HEARTBEAT", "look", "PULSING", ["pulsing"]),
    modifierAward("zoom", "ZM", "EAGLE EYE", "look", "ZOOMED", ["zoom"]),
    modifierAward("splitMirror", "SM", "HALF AND HALF", "look", "SPLIT MIRROR", ["splitMirror"]),
    modifierAward("countUp", "CU", "TIME BENDER", "look", "COUNT UP", ["countUp"]),
    modifierAward("assemble", "AS", "BUILDER", "look", "ASSEMBLE", ["assemble"]),
    modifierAward("fontFlip", "FF", "TYPE CASTER", "look", "FONT FLIP", ["fontFlip"]),
    modifierAward("negative", "NG", "DARKROOM", "look", "NEGATIVE", ["negative"]),
    modifierAward("wait", "WT", "PATIENCE", "rule", "WAIT", ["wait"]),
    modifierAward("doubleTap", "DT", "DOUBLE TROUBLE", "rule", "DOUBLE TAP", ["doubleTap"]),
    modifierAward("twoWords", "TW", "DOUBLE VISION", "rule", "TWO WORDS", ["twoWords"]),
];

export function awardById(id: AwardId): Award {
    const award = AWARDS.find((candidate) => candidate.id === id);
    if (!award) throw new Error(`Award ${id} is missing in AWARDS`);
    return award;
}
