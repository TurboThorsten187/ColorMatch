import { noise, type Point, type Size } from "@/modifiers/look.ts";

// The word is complete after this share of the time limit. Every letter starts at a random time in the first half of
// that and flies for the other half.
export const ASSEMBLE_SHARE = 0.25;
const FLIGHT = 0.5;
// Letters start this many font sizes outside the screen
export const ASSEMBLE_MARGIN = 0.5;
// Letters start anywhere along an edge, but not in its outer tenths
const ALONG = 0.8;
const SALT = 41;

// How far a letter still is from its place: 1 where it starts, 0 once it has arrived
export function assembleRemaining(seed: number, letter: number, elapsed: number, timeLimit: number): number {
    const progress = elapsed / (timeLimit * ASSEMBLE_SHARE);
    const start = noise(seed, letter, SALT) * (1 - FLIGHT);
    return 1 - Math.min(1, Math.max(0, (progress - start) / FLIGHT));
}

// Where a letter starts, relative to the middle of `area`: `margin` outside a random edge
export function assembleStart(seed: number, letter: number, area: Size, margin: number): Point {
    const along = noise(seed, letter, SALT + 2) - 0.5;
    switch (Math.floor(noise(seed, letter, SALT + 1) * 4)) {
        case 0:
            return { x: -area.width / 2 - margin, y: along * area.height * ALONG };
        case 1:
            return { x: area.width / 2 + margin, y: along * area.height * ALONG };
        case 2:
            return { x: along * area.width * ALONG, y: -area.height / 2 - margin };
        default:
            return { x: along * area.width * ALONG, y: area.height / 2 + margin };
    }
}
