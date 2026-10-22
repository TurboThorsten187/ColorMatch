import { groupById } from "@/modifiers/registry.ts";
import type { ModifierGroupId } from "@/modifiers/types.ts";
import { MODIFIER_CLEARS_NEEDED } from "./balance.ts";

// Clearing levels: four milestones, the surges, and 10 levels with each modifier group (an award per group, with the
// group's id)
export type AwardId = "level10" | "level25" | "level50" | "level100" | "surge" | ModifierGroupId;

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

// Clearing a level with the group counts once
export interface ModifierAward extends AwardBase {
    readonly id: ModifierGroupId;
    readonly kind: "rule" | "look";
}

// Clearing a surge level counts once
export interface SurgeAward extends AwardBase {
    readonly kind: "surge";
}

export type Award = MilestoneAward | SurgeAward | ModifierAward;

// The modifier awards in the order the stats screen shows them, rules first
const MODIFIER_AWARD_ORDER: readonly ModifierGroupId[] = [
    "invertInput",
    "noClick",
    "spam",
    "mirror",
    "background",
    "blink",
    "blur",
    "rotation",
    "moving",
    "scrambled",
    "shaky",
    "pulsing",
    "zoom",
    "splitMirror",
    "countUp",
    "assemble",
    "fontFlip",
    "negative",
    "wait",
    "doubleTap",
    "twoWords",
];

function milestone(id: AwardId, level: number): MilestoneAward {
    return { id, code: String(level), name: `LEVEL ${level}`, rule: `CLEAR LEVEL ${level}`, kind: "milestone", level };
}

function modifierAward(id: ModifierGroupId): ModifierAward {
    const group = groupById(id);
    const { code, name, levels, verb = "BEAT" } = group.award;
    return {
        id,
        code,
        name,
        rule: `${verb} ${MODIFIER_CLEARS_NEEDED} ${levels} LEVELS`,
        kind: group.rule ? "rule" : "look",
    };
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
    ...MODIFIER_AWARD_ORDER.map(modifierAward),
];

export function awardById(id: AwardId): Award {
    const award = AWARDS.find((candidate) => candidate.id === id);
    if (!award) throw new Error(`Award ${id} is missing in AWARDS`);
    return award;
}
