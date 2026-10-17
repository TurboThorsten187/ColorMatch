import { type Color, randomColor } from "./colors.ts";

export const InputType = {
    TRUE: "true",
    FALSE: "false",
    NONE: "none",
    SPAM: "spam",
} as const;

export type InputType = (typeof InputType)[keyof typeof InputType];

export interface Challenge {
    readonly text: Color;
    readonly color: Color;
    readonly correctInput: InputType;
}

// In 50 % der Fälle passt das Wort zur Schriftfarbe (TRUE), sonst nicht (FALSE)
export function createChallenge(): Challenge {
    const color = randomColor();

    if (Math.random() < 0.5) {
        return { text: randomColor(color), color, correctInput: InputType.FALSE };
    }
    return { text: color, color, correctInput: InputType.TRUE };
}
