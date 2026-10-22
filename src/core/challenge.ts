import { groupById, inGroupOrder } from "@/modifiers/registry.ts";
import type { LevelContext, ModifierGroupId, ModifierId } from "@/modifiers/types.ts";
import { type Color, randomColor } from "./colors.ts";
import { pick, type Rng } from "./random.ts";

// "true": the word names its own ink color, "false": it does not
export type Answer = "true" | "false";

// What the player has to do: answer, keep still ("none") or press repeatedly ("spam")
export type ExpectedInput = Answer | "none" | "spam";

// How many times faster than normal a group's animation plays; groups that are missing play at normal speed
export type Tempo = Readonly<Partial<Record<ModifierGroupId, number>>>;

// How strong a group's effect is, from 0 on its intro level to 1 in the late game; groups that are missing are at 0
export type Strength = Readonly<Partial<Record<ModifierGroupId, number>>>;

// A color word in an ink, true when the word names its ink
export interface ColorWord {
    readonly word: Color;
    readonly color: Color;
}

export interface Challenge extends ColorWord {
    // The level's modifier groups in the order of MODIFIER_GROUPS, and the modifier each one brought
    readonly groups: readonly ModifierGroupId[];
    readonly modifiers: ReadonlySet<ModifierId>;
    readonly expected: ExpectedInput;
    // Presses of the expected input that solve the level (more with DOUBLE TAP and SPAM!)
    readonly presses: number;
    // Share of the time limit during which a press loses the level (WAIT)
    readonly lockedShare: number;
    // Only set with the background modifier: any color but the inks, so it says nothing about the answer
    readonly background: Color | null;
    // Only non-zero with the rotation modifier, the angle the spinning word starts at
    readonly rotationDeg: number;
    // Between 0 and 1, makes moving, shaking, pulsing and scrambling look different on every level
    readonly seed: number;
    readonly tempo: Tempo;
    // Rotation, pulsing, shaking, blur and font flip grow with it
    readonly strength: Strength;
    // Only set with the two words modifier: the lower word, the upper one is `word` in `color`
    readonly second: ColorWord | null;
    // The word's size relative to normal, below 1 only with the zoom modifier
    readonly size: number;
}

const FIRST_LEVEL: LevelContext = { level: 1, mode: "normal", introducedOn: () => 1 };

// A challenge of the given groups: one modifier of each, the rule of the rule group if there is one, then what the
// groups add to the words and around them
export function createChallenge(
    groups: readonly ModifierGroupId[],
    rng: Rng,
    level: LevelContext = FIRST_LEVEL,
    tempo: Tempo = {},
    strength: Strength = {},
): Challenge {
    const ordered = inGroupOrder(groups);
    const definitions = ordered.map(groupById);
    const color = randomColor(rng);
    const answer: Answer = rng() >= 0.5 ? "true" : "false";
    const modifiers: ReadonlySet<ModifierId> = new Set(
        definitions.map((group) => group.pickVariant?.(ordered, rng) ?? pick(rng, group.variants)),
    );
    const rule = definitions.find((group) => group.rule)?.rule;

    let challenge: Challenge = {
        word: answer === "true" ? color : randomColor(rng, color),
        color,
        groups: ordered,
        modifiers,
        expected: rule?.expect?.(answer) ?? answer,
        presses: rule?.presses ?? 1,
        lockedShare: rule?.lockedShare ?? 0,
        background: null,
        rotationDeg: 0,
        seed: rng(),
        tempo,
        strength,
        second: null,
        size: 1,
    };
    for (const group of definitions) if (group.words) challenge = { ...challenge, ...group.words(challenge, rng) };
    for (const group of definitions) {
        if (group.decorate) challenge = { ...challenge, ...group.decorate(challenge, level, rng) };
    }
    return challenge;
}
