export const Colors = {
    RED: "red",
    GREEN: "green",
    BLUE: "blue",
    YELLOW: "yellow",
    PURPLE: "purple",
    CYAN: "cyan",
} as const;

export type Color = (typeof Colors)[keyof typeof Colors];

export const COLOR_LIST: readonly Color[] = Object.values(Colors);

// Zufällige Farbe, optional ohne eine bestimmte Farbe
export function randomColor(exclude?: Color): Color {
    const candidates = COLOR_LIST.filter(c => c !== exclude);
    return candidates[Math.floor(Math.random() * candidates.length)];
}
