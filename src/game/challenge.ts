import { type Color, COLORS, randomColor } from "./colors.ts";
import { groupById, type ModifierGroupId, type ModifierId } from "./modifiers.ts";
import type { Rng } from "./random.ts";

// "true": the word names its own ink color, "false": it does not
export type Answer = "true" | "false";

// What the player has to do: answer, keep still ("none") or press repeatedly ("spam")
export type ExpectedInput = Answer | "none" | "spam";

export interface Challenge {
    readonly word: Color;
    readonly color: Color;
    readonly modifiers: ReadonlySet<ModifierId>;
    readonly expected: ExpectedInput;
    // Only set with the background modifier
    readonly background: Color | null;
    // Only non-zero with the rotation modifier
    readonly rotationDeg: number;
    // Between 0 and 1, makes moving, shaking, pulsing and scrambling look different on every level
    readonly seed: number;
}

export function createChallenge(groups: readonly ModifierGroupId[], level: number, rng: Rng): Challenge {
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
        background: modifiers.has("background") ? backgroundColor(word, color, expected, modifiers, level) : null,
        rotationDeg: modifiers.has("rotation") ? rotationDeg(level) : 0,
        seed: rng(),
    };
}

export function expectedInput(answer: Answer, modifiers: ReadonlySet<ModifierId>): ExpectedInput {
    if (modifiers.has("spam")) return "spam";
    if (modifiers.has("noClick")) return "none";
    if (modifiers.has("invertInput")) return answer === "true" ? "false" : "true";
    return answer;
}

// A mismatching word gets a background in the color it names as a lure,
// otherwise any color that differs from the ink so the text stays visible.
function backgroundColor(
    word: Color,
    color: Color,
    expected: ExpectedInput,
    modifiers: ReadonlySet<ModifierId>,
    level: number,
): Color {
    if (expected === "false" && !modifiers.has("invertInput")) {
        return word;
    }
    const others = COLORS.filter((other) => other !== color);
    return others[(level * 31 + 7) % others.length];
}

// Pseudo-random but stable per level, between -90 and +90 degrees
function rotationDeg(level: number): number {
    return ((level * 53 + 19) % 181) - 90;
}
