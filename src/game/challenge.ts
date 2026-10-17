import { type Color, COLORS, randomColor } from "./colors.ts";
import { groupById, type ModifierGroupId, type ModifierId } from "./modifiers.ts";
import { pick, type Rng } from "./random.ts";

// "true": the word names its own ink color, "false": it does not
export type Answer = "true" | "false";

// What the player has to do: answer, keep still ("none") or press repeatedly ("spam")
export type ExpectedInput = Answer | "none" | "spam";

// How many times faster than normal a group's animation plays; groups that are missing play at normal speed
export type Tempo = Readonly<Partial<Record<ModifierGroupId, number>>>;

export interface Challenge {
    readonly word: Color;
    readonly color: Color;
    readonly modifiers: ReadonlySet<ModifierId>;
    readonly expected: ExpectedInput;
    // Only set with the background modifier: any color but the ink, so it says nothing about the answer
    readonly background: Color | null;
    // Only non-zero with the rotation modifier, the angle the spinning word starts at
    readonly rotationDeg: number;
    // Between 0 and 1, makes moving, shaking, pulsing and scrambling look different on every level
    readonly seed: number;
    readonly tempo: Tempo;
}

export function createChallenge(
    groups: readonly ModifierGroupId[],
    level: number,
    rng: Rng,
    tempo: Tempo = {},
): Challenge {
    const color = randomColor(rng);
    const matches = rng() >= 0.5;
    const word = matches ? color : randomColor(rng, color);
    const modifiers: ReadonlySet<ModifierId> = new Set(
        groups.map((id) => {
            const { variants } = groupById(id);
            return variants[Math.floor(rng() * variants.length)];
        }),
    );
    const expected = expectedInput(matches ? "true" : "false", modifiers);

    return {
        word,
        color,
        modifiers,
        expected,
        background: modifiers.has("background")
            ? pick(
                  rng,
                  COLORS.filter((other) => other !== color),
              )
            : null,
        rotationDeg: modifiers.has("rotation") ? rotationDeg(level) : 0,
        seed: rng(),
        tempo,
    };
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
