import { pick, type Rng } from "./random.ts";

export const COLORS = ["red", "green", "blue", "yellow", "purple", "cyan"] as const;

export type Color = (typeof COLORS)[number];

// The color name is the word shown on screen, this is the CSS value used to paint it.
// Bright neon tones, tuned to stay readable and distinct on the black arcade background.
export const COLOR_CSS: Readonly<Record<Color, string>> = {
    red: "#ff3b4e",
    green: "#3dff7a",
    blue: "#1765fb",
    yellow: "#ffe14d",
    purple: "#c45cff",
    cyan: "#22e4ff",
};

// The colorblind mode shows every color as a shape: the word names a shape, the letters are filled with shapes
export const SHAPE_WORDS: Readonly<Record<Color, string>> = {
    red: "HEART",
    green: "TRIANGLE",
    blue: "SQUARE",
    yellow: "STAR",
    purple: "PLUS",
    cyan: "CIRCLE",
};

export function wordFor(color: Color, colorblind: boolean): string {
    return colorblind ? SHAPE_WORDS[color] : color.toUpperCase();
}

export function randomColor(rng: Rng, exclude?: Color): Color {
    return pick(
        rng,
        COLORS.filter((color) => color !== exclude),
    );
}
