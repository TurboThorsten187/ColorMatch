import type { ModifierId } from "../game/modifiers.ts";

// Moving, shaking, pulsing and scrambling only depend on the time since the word appeared and the level's seed,
// so they stand still while the game is paused and look the same after resuming.

export interface Size {
    readonly width: number;
    readonly height: number;
}

export interface WordMotion {
    readonly x: number;
    readonly y: number;
    readonly scale: number;
}

const MOVING_FONT_SCALE = 0.62;
const MOVING_PERIOD_X_MS = 2600;
const MOVING_PERIOD_Y_MS = 1900;
const MOVING_MARGIN = 10;

const SHAKE_STEP_MS = 45;
const SHAKE_FONT_SCALE = 0.94;
// Share of the free area the word jumps around in
const SHAKE_X = 0.035;
const SHAKE_Y = 0.1;

const PULSE_PERIOD_MS = 350;
const PULSE_MIN = 0.7;
const PULSE_MAX = 1.14;

const SCRAMBLE_STEP_MS = 380;

// Font size factor that keeps the moved, shaken or grown word on screen
export function effectFontScale(modifiers: ReadonlySet<ModifierId>): number {
    return (
        (modifiers.has("moving") ? MOVING_FONT_SCALE : 1) *
        (modifiers.has("shaky") ? SHAKE_FONT_SCALE : 1) *
        (modifiers.has("pulsing") ? 1 / PULSE_MAX : 1)
    );
}

// Offset and scale of the word inside `area`, the free rectangle around the screen center. `word` is the space
// the word takes up at scale 1.
export function wordMotion(
    modifiers: ReadonlySet<ModifierId>,
    seed: number,
    elapsed: number,
    area: Size,
    word: Size,
): WordMotion {
    const shakeX = modifiers.has("shaky") ? area.width * SHAKE_X : 0;
    const shakeY = modifiers.has("shaky") ? area.height * SHAKE_Y : 0;
    let x = 0;
    let y = 0;
    if (modifiers.has("moving")) {
        // A shaking word needs the shake's amplitude as extra margin, or it leaves the screen at the turning points
        const grown = modifiers.has("pulsing") ? PULSE_MAX : 1;
        const roomX = Math.max(0, (area.width - word.width * grown) / 2 - MOVING_MARGIN - shakeX);
        const roomY = Math.max(0, (area.height - word.height * grown) / 2 - shakeY);
        x += roomX * triangle(elapsed / MOVING_PERIOD_X_MS + seed);
        y += roomY * triangle(elapsed / MOVING_PERIOD_Y_MS + seed * 1.7);
    }
    if (modifiers.has("shaky")) {
        const step = Math.floor(elapsed / SHAKE_STEP_MS);
        x += shakeX * signedNoise(seed, step, 1);
        y += shakeY * signedNoise(seed, step, 2);
    }
    return { x, y, scale: modifiers.has("pulsing") ? pulseScale(seed, elapsed) : 1 };
}

export function pulseScale(seed: number, elapsed: number): number {
    const middle = (PULSE_MIN + PULSE_MAX) / 2;
    const swing = (PULSE_MAX - PULSE_MIN) / 2;
    return middle + swing * Math.sin((2 * Math.PI * (elapsed + seed * PULSE_PERIOD_MS)) / PULSE_PERIOD_MS);
}

// The letters in a new order every few hundred ms, never the right one
export function letterOrder(length: number, seed: number, elapsed: number): number[] {
    const step = Math.floor(elapsed / SCRAMBLE_STEP_MS);
    const order = Array.from({ length }, (_, i) => i);
    for (let i = length - 1; i > 0; i--) {
        const j = Math.floor(noise(seed, step, i) * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
    }
    // Shifting by one is never the right order either
    return order.every((value, index) => value === index) ? order.map((_, i) => (i + 1) % length) : order;
}

export function scramble(word: string, seed: number, elapsed: number): string {
    const order = letterOrder(word.length, seed, elapsed);
    // Swapping two equal letters, like the Es in GREEN, still shows the word: shift the order until it differs
    for (let shift = 0; shift < order.length; shift++) {
        const scrambled = order.map((_, i) => word[order[(i + shift) % order.length]]).join("");
        if (scrambled !== word) return scrambled;
    }
    return word;
}

// -1 at the start, 1 halfway, -1 again after a full period: straight lines that bounce off both sides
function triangle(phase: number): number {
    return 1 - 4 * Math.abs(phase - Math.floor(phase) - 0.5);
}

function signedNoise(seed: number, step: number, salt: number): number {
    return noise(seed, step, salt) * 2 - 1;
}

// Deterministic value in [0, 1) for a seed, a time step and a salt
function noise(seed: number, step: number, salt: number): number {
    let hash = Math.imul(Math.floor(seed * 2 ** 31) ^ 0x9e3779b9, 0x85ebca6b);
    hash = Math.imul(hash ^ step ^ (hash >>> 15), 0xc2b2ae35);
    hash = Math.imul(hash ^ (salt * 0x27d4eb2f) ^ (hash >>> 13), 0x165667b1);
    hash ^= hash >>> 16;
    return (hash >>> 0) / 2 ** 32;
}
