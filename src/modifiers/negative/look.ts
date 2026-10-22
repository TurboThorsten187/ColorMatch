import type { Point } from "@/modifiers/look.ts";

// The photo negative shows from 10 % to 50 % of the time limit, its afterimage fades out after it
const FROM = 0.1;
const UNTIL = 0.5;
export const AFTERIMAGE_MS = 400;
// Where the afterimage lies behind the word, in px at the word's normal size
export const AFTERIMAGE_OFFSET: Point = { x: 12, y: 8 };

export function isNegative(elapsed: number, timeLimit: number): boolean {
    return elapsed >= timeLimit * FROM && elapsed < timeLimit * UNTIL;
}

// The afterimage: the word in its negative colors, fading out once the negative is gone
export function afterimageOpacity(elapsed: number, timeLimit: number): number {
    const since = elapsed - timeLimit * UNTIL;
    return since >= 0 && since < AFTERIMAGE_MS ? 1 - since / AFTERIMAGE_MS : 0;
}
