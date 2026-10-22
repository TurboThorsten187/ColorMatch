import { type Color, COLOR_CSS } from "@/core/colors.ts";

// The colorblind mode fills the letters with small shapes, one shape per color (see SHAPE_WORDS)

const BOX = 24;
// Shapes in a 24 x 24 box
const PATHS: Readonly<Record<Color, string>> = {
    red: "M12 21.4l-1.5-1.3C5.4 15.4 2 12.3 2 8.5 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.5c0 3.8-3.4 6.9-8.5 11.5z",
    green: "M12 2.5L22.5 21h-21z",
    blue: "M3 3h18v18H3z",
    yellow: starPath(),
    purple: "M8.5 2h7v6.5H22v7h-6.5V22h-7v-6.5H2v-7h6.5z",
    cyan: "M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20z",
};
// Distance between two shapes in a row, in shape sizes
const SPACING = 1.25;
// Shape size in the letters and on the background, scaling with the screen like all other sizes
const INK_SHAPE = "max(13px, calc(1.6 * var(--unit)))";
const BACKGROUND_SHAPE = "max(44px, calc(5.4 * var(--unit)))";
// The letters are the ink at this opacity, the shapes on them the full ink
const LETTER_ALPHA = "66";
const BACKGROUND_SHAPE_COLOR = "#2c2c2c";

function starPath(): string {
    const points = Array.from({ length: 10 }, (_, i) => {
        const radius = i % 2 === 0 ? 11 : 4.6;
        const angle = -Math.PI / 2 + (i * Math.PI) / 5;
        return `${(12 + radius * Math.cos(angle)).toFixed(2)} ${(13 + radius * Math.sin(angle)).toFixed(2)}`;
    });
    return `M${points.join("L")}Z`;
}

// Staggered rows on `base`: one shape in the middle of the upper half, two halves at the sides of the lower half,
// so tiles side by side and on top of each other give a seamless pattern
function tile(color: Color, fill: string, base: string): string {
    const step = BOX * SPACING;
    const at = (x: number, y: number): string =>
        `<path transform='translate(${x - BOX / 2} ${y - BOX / 2})' d='${PATHS[color]}' fill='${fill}'/>`;
    const svg =
        `<svg xmlns='http://www.w3.org/2000/svg' width='${step}' height='${step * 2}' viewBox='0 0 ${step} ${step * 2}'>` +
        `<rect width='${step}' height='${step * 2}' fill='${base}'/>` +
        `${at(step / 2, step / 2)}${at(0, step * 1.5)}${at(step, step * 1.5)}</svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function tileSize(shape: string): string {
    return `calc(${shape} * ${SPACING}) calc(${shape} * ${SPACING * 2})`;
}

// Inline style for text in `color`: plain ink, or in the colorblind mode letters filled with the color's shapes
export function inkStyle(color: Color, colorblind: boolean): string {
    if (!colorblind) return `color: ${COLOR_CSS[color]}`;
    return [
        "color: transparent",
        `background-image: ${tile(color, COLOR_CSS[color], `${COLOR_CSS[color]}${LETTER_ALPHA}`)}`,
        `background-size: ${tileSize(INK_SHAPE)}`,
        "-webkit-background-clip: text",
        "background-clip: text",
    ].join("; ");
}

// The background modifier: the color, or in the colorblind mode its shapes, large and dim on black. Small boxes such
// as the example on the modifier card pass `small`, or they would only show a piece of one shape.
export function backgroundStyle(color: Color, colorblind: boolean, small = false): string {
    return colorblind
        ? `#000 ${tile(color, BACKGROUND_SHAPE_COLOR, "transparent")} 0 0 / ${tileSize(small ? INK_SHAPE : BACKGROUND_SHAPE)}`
        : COLOR_CSS[color];
}
