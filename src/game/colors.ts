import { pick, type Rng } from "./random.ts";

export const COLORS = ["red", "green", "blue", "yellow", "purple", "cyan"] as const;

export type Color = (typeof COLORS)[number];

// The color name is the word shown on screen, this is the CSS value used to paint it.
// Yellow and cyan are darker than their CSS namesakes, which are barely readable on white.
export const COLOR_CSS: Readonly<Record<Color, string>> = {
    red: "#ff0000",
    green: "#008000",
    blue: "#0000ff",
    yellow: "#d4a900",
    purple: "#800080",
    cyan: "#00a0b0",
};

export function randomColor(rng: Rng, exclude?: Color): Color {
    return pick(
        rng,
        COLORS.filter((color) => color !== exclude),
    );
}
