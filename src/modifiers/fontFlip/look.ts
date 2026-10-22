import { lerp, noise } from "@/modifiers/look.ts";

const STEP_MS = 200;
const SALT = 100;
// How often a wild font comes compared to a readable one, from strength 0 to 1: 1.5 times as often at full strength
const WILD_GENTLE = 0.5;
const WILD_STRONG = 0.75;

// How often a font is picked: 1 for a readable one, less for a wild one
export function fontWeight(wild: boolean, strength: number): number {
    return wild ? lerp(WILD_GENTLE, WILD_STRONG, strength) : 1;
}

// The font (an index into `weights`) of a letter after it `played` ms: a new random one every 200 ms, never the same
// twice in a row, each one as often as its weight says
export function flipFont(seed: number, letter: number, played: number, weights: readonly number[]): number {
    const steps = Math.floor(played / STEP_MS);
    let font = weightedIndex(weights, noise(seed, 0, SALT + letter), -1);
    for (let step = 1; step <= steps; step++) {
        font = weightedIndex(weights, noise(seed, step, SALT + letter), font);
    }
    return font;
}

// The index `value` (in [0, 1)) falls on when every index but `skip` takes up a share as large as its weight
function weightedIndex(weights: readonly number[], value: number, skip: number): number {
    const total = weights.reduce((sum, weight, index) => (index === skip ? sum : sum + weight), 0);
    let rest = value * total;
    let last = -1;
    for (let index = 0; index < weights.length; index++) {
        if (index === skip || weights[index] <= 0) continue;
        last = index;
        rest -= weights[index];
        if (rest < 0) return index;
    }
    // Only reached through rounding: the last index that could be picked
    return last;
}
