import { pick, type Rng } from "./random.ts";

export const COLORS = ["red", "green", "blue", "yellow", "purple", "cyan"] as const;

export type Color = (typeof COLORS)[number];

// The color name is the word shown on screen, this is the CSS value used to paint it
export const COLOR_CSS: Readonly<Record<Color, string>> = {
    red: "red",
    green: "green",
    blue: "blue",
    yellow: "yellow",
    purple: "purple",
    cyan: "cyan",
};

export function randomColor(rng: Rng, exclude?: Color): Color {
    return pick(
        rng,
        COLORS.filter((color) => color !== exclude),
    );
}
