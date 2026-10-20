import { type Color, COLORS, randomColor } from "./colors.ts";
import { groupById, type ModifierGroupId, type ModifierId } from "./modifiers.ts";
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
    readonly modifiers: ReadonlySet<ModifierId>;
    readonly expected: ExpectedInput;
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

// SYMMETRY looks the same mirrored left to right, so with it only the upside-down mirror changes anything
const SYMMETRY_MIRRORS: readonly ModifierId[] = ["mirrorVertical"];

export function createChallenge(
    groups: readonly ModifierGroupId[],
    level: number,
    rng: Rng,
    tempo: Tempo = {},
    size = 1,
    strength: Strength = {},
): Challenge {
    const color = randomColor(rng);
    const matches = rng() >= 0.5;
    // With two words, TRUE means both words are true or both are false: the upper word's truth is drawn, the lower
    // one follows from the answer
    const twoWords = groups.includes("twoWords");
    const firstTrue = twoWords ? rng() < 0.5 : matches;
    const word = firstTrue ? color : randomColor(rng, color);
    const modifiers: ReadonlySet<ModifierId> = new Set(
        groups.map((id) => {
            const variants =
                id === "mirror" && groups.includes("splitMirror") ? SYMMETRY_MIRRORS : groupById(id).variants;
            return variants[Math.floor(rng() * variants.length)];
        }),
    );
    const expected = expectedInput(matches ? "true" : "false", modifiers);
    const second = twoWords ? colorWord(matches ? firstTrue : !firstTrue, rng) : null;

    return {
        word,
        color,
        modifiers,
        expected,
        // Never the ink of a word, or that word would vanish
        background: modifiers.has("background")
            ? pick(
                  rng,
                  COLORS.filter((other) => other !== color && other !== second?.color),
              )
            : null,
        rotationDeg: modifiers.has("rotation") ? rotationDeg(level) : 0,
        seed: rng(),
        tempo,
        strength,
        second,
        size: modifiers.has("zoom") ? size : 1,
    };
}

function colorWord(truthful: boolean, rng: Rng): ColorWord {
    const color = randomColor(rng);
    return { word: truthful ? color : randomColor(rng, color), color };
}

export function expectedInput(answer: Answer, modifiers: ReadonlySet<ModifierId>): ExpectedInput {
    if (modifiers.has("spam")) return "spam";
    if (modifiers.has("noClick")) return "none";
    if (modifiers.has("invertInput")) return answer === "true" ? "false" : "true";
    return answer;
}

// Pseudo-random but stable per level, between -90 and +90 degrees
function rotationDeg(level: number): number {
    return ((level * 53 + 19) % 181) - 90;
}
