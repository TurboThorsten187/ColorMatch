import type { Point, Size } from "@/modifiers/look.ts";

// A moving word is smaller, so it has room to move
export const MOVING_FONT_SCALE = 0.62;
const PERIOD_X_MS = 3000;
const PERIOD_Y_MS = 2200;
// Distance a moving word keeps from the left and right side
const MARGIN = 10;

// Where a moving word is after it `played` ms, relative to the middle of `area`: it glides in straight lines and
// bounces off the sides. `word` is the space it takes up, `keep` how much further it stays from the sides.
export function drift(seed: number, played: number, area: Size, word: Size, keep: Point): Point {
    const roomX = Math.max(0, (area.width - word.width) / 2 - MARGIN - keep.x);
    const roomY = Math.max(0, (area.height - word.height) / 2 - keep.y);
    return {
        x: roomX * triangle(played / PERIOD_X_MS + seed),
        y: roomY * triangle(played / PERIOD_Y_MS + seed * 1.7),
    };
}

// -1 at the start, 1 halfway, -1 again after a full period: straight lines that bounce off both sides
function triangle(phase: number): number {
    return 1 - 4 * Math.abs(phase - Math.floor(phase) - 0.5);
}
