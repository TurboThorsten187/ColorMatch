import { lerp, type Point, signedNoise, type Size } from "@/modifiers/look.ts";

export interface Shake extends Point {
    // Degrees
    readonly rotation: number;
}

const STEP_MS = 60;
// Share of the free area the word jumps around in, times a factor that grows with the strength, and how far it tilts
// with every jump. Like every effect that grows with the strength, at full strength it is 1.5 times what it is at none.
const SHARE_X = 0.02;
const SHARE_Y = 0.05;
const FACTOR_GENTLE = 0.6;
const FACTOR_STRONG = 0.9;
const TILT_GENTLE_DEG = 4;
const TILT_STRONG_DEG = 6;
// Font size given up per unit of the factor, so the shaking word stays on screen
const FONT_SHRINK = 0.06;

// How far a shaking word tilts at most, in degrees
export function shakeTiltDeg(strength: number): number {
    return lerp(TILT_GENTLE_DEG, TILT_STRONG_DEG, strength);
}

// Font size factor that keeps the shaking word on screen
export function shakeFontScale(strength: number): number {
    return 1 - FONT_SHRINK * shakeFactor(strength);
}

// How far a shaking word jumps from its place at most, in `area`. `size` is a zoomed word's size relative to normal:
// it shakes as much relative to its own size as a normal word.
export function shakeReach(area: Size, strength: number, size: number): Point {
    const shake = shakeFactor(strength) * size;
    return { x: area.width * SHARE_X * shake, y: area.height * SHARE_Y * shake };
}

// The jump and tilt of a shaking word after it `played` ms, a new one every 60 ms
export function shake(seed: number, played: number, reach: Point, strength: number): Shake {
    const step = Math.floor(played / STEP_MS);
    return {
        x: reach.x * signedNoise(seed, step, 1),
        y: reach.y * signedNoise(seed, step, 2),
        rotation: shakeTiltDeg(strength) * signedNoise(seed, step, 3),
    };
}

function shakeFactor(strength: number): number {
    return lerp(FACTOR_GENTLE, FACTOR_STRONG, strength);
}
