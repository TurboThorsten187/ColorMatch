import type { Tempo } from "../game/challenge.ts";
import type { ModifierId } from "../game/modifiers.ts";

// Moving, shaking, pulsing, spinning, fading and scrambling only depend on the time since the word appeared and the
// level's seed, so they stand still while the game is paused and look the same after resuming.

export interface Size {
    readonly width: number;
    readonly height: number;
}

export interface WordMotion {
    readonly x: number;
    readonly y: number;
    readonly scale: number;
    // Degrees, from shaking
    readonly rotation: number;
}

const MOVING_FONT_SCALE = 0.62;
const MOVING_PERIOD_X_MS = 1500;
const MOVING_PERIOD_Y_MS = 1100;
const MOVING_MARGIN = 10;

const SHAKE_STEP_MS = 60;
const SHAKE_FONT_SCALE = 0.94;
// Share of the free area the word jumps around in, and how far it tilts with every jump
const SHAKE_X = 0.02;
const SHAKE_Y = 0.05;
export const SHAKE_TILT_DEG = 7;

const PULSE_PERIOD_MS = 350;
const PULSE_MIN = 0.7;
const PULSE_MAX = 1.14;

const SCRAMBLE_STEP_MS = 380;
// Shifts the seed for every word of a rule text, so it is not mixed in step with the color word
const WORD_SEED_STEP = 0.37;

const SPIN_MS = 2500;
const FADE_MS = 900;

// ASSEMBLE: the word is complete after this share of the time limit. Every letter starts at a random time in the
// first half of that and flies for the other half.
export const ASSEMBLE_SHARE = 0.25;
const ASSEMBLE_FLIGHT = 0.5;
// Letters start anywhere along an edge, but not in its outer tenths
const ASSEMBLE_ALONG = 0.8;
const ASSEMBLE_SALT = 41;

const FONT_FLIP_MS = 200;
const FONT_FLIP_SALT = 100;

// NEGATIVE: the photo negative shows from 10 % to 50 % of the time limit, its afterimage fades out after it
const NEGATIVE_FROM = 0.1;
const NEGATIVE_UNTIL = 0.5;
export const AFTERIMAGE_MS = 400;

// Font size factor that keeps the moved, shaken or grown word on screen
export function effectFontScale(modifiers: ReadonlySet<ModifierId>): number {
    return (
        (modifiers.has("moving") ? MOVING_FONT_SCALE : 1) *
        (modifiers.has("shaky") ? SHAKE_FONT_SCALE : 1) *
        (modifiers.has("pulsing") ? 1 / PULSE_MAX : 1)
    );
}

// Offset and scale of the word inside `area`, the free rectangle around the screen center. `word` is the space
// the word takes up at scale 1. `tempo` speeds up moving, shaking and pulsing.
export function wordMotion(
    modifiers: ReadonlySet<ModifierId>,
    seed: number,
    elapsed: number,
    area: Size,
    word: Size,
    tempo: Tempo = {},
): WordMotion {
    const shakeX = modifiers.has("shaky") ? area.width * SHAKE_X : 0;
    const shakeY = modifiers.has("shaky") ? area.height * SHAKE_Y : 0;
    let x = 0;
    let y = 0;
    let rotation = 0;
    if (modifiers.has("moving")) {
        // A shaking word needs the shake's amplitude as extra margin, or it leaves the screen at the turning points
        const grown = modifiers.has("pulsing") ? PULSE_MAX : 1;
        const roomX = Math.max(0, (area.width - word.width * grown) / 2 - MOVING_MARGIN - shakeX);
        const roomY = Math.max(0, (area.height - word.height * grown) / 2 - shakeY);
        const moved = elapsed * (tempo.moving ?? 1);
        x += roomX * triangle(moved / MOVING_PERIOD_X_MS + seed);
        y += roomY * triangle(moved / MOVING_PERIOD_Y_MS + seed * 1.7);
    }
    if (modifiers.has("shaky")) {
        const step = Math.floor((elapsed * (tempo.shaky ?? 1)) / SHAKE_STEP_MS);
        x += shakeX * signedNoise(seed, step, 1);
        y += shakeY * signedNoise(seed, step, 2);
        rotation = SHAKE_TILT_DEG * signedNoise(seed, step, 3);
    }
    const scale = modifiers.has("pulsing") ? pulseScale(seed, elapsed * (tempo.pulsing ?? 1)) : 1;
    return { x, y, scale, rotation };
}

// Degrees a rotated word has turned since it appeared: a full turn every 2.5 s, left or right depending on the seed
export function spin(seed: number, elapsed: number): number {
    const turns = elapsed / SPIN_MS;
    return 360 * (seed < 0.5 ? turns : -turns);
}

// A blinking word fades away instead of vanishing at once
export function fadeOpacity(elapsed: number): number {
    return Math.max(0, 1 - elapsed / FADE_MS);
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

// A rule text like DON'T CLICK is mixed word by word, each word in its own order, so it still reads as two words
export function scrambleWords(text: string, seed: number, elapsed: number): string {
    return text
        .split(" ")
        .map((word, index) => scramble(word, (seed + WORD_SEED_STEP * (index + 1)) % 1, elapsed))
        .join(" ");
}

// How far a letter of ASSEMBLE still is from its place: 1 where it starts, 0 once it has arrived
export function assembleRemaining(seed: number, letter: number, elapsed: number, timeLimit: number): number {
    const progress = elapsed / (timeLimit * ASSEMBLE_SHARE);
    const start = noise(seed, letter, ASSEMBLE_SALT) * (1 - ASSEMBLE_FLIGHT);
    return 1 - Math.min(1, Math.max(0, (progress - start) / ASSEMBLE_FLIGHT));
}

// Where a letter of ASSEMBLE starts, relative to the center of `area`: `margin` outside a random edge
export function assembleStart(seed: number, letter: number, area: Size, margin: number): { x: number; y: number } {
    const along = noise(seed, letter, ASSEMBLE_SALT + 2) - 0.5;
    switch (Math.floor(noise(seed, letter, ASSEMBLE_SALT + 1) * 4)) {
        case 0:
            return { x: -area.width / 2 - margin, y: along * area.height * ASSEMBLE_ALONG };
        case 1:
            return { x: area.width / 2 + margin, y: along * area.height * ASSEMBLE_ALONG };
        case 2:
            return { x: along * area.width * ASSEMBLE_ALONG, y: -area.height / 2 - margin };
        default:
            return { x: along * area.width * ASSEMBLE_ALONG, y: area.height / 2 + margin };
    }
}

// The font (an index below `count`) of a letter of FONT FLIP: a new random one every 200 ms, never the same twice in
// a row
export function flipFont(seed: number, letter: number, elapsed: number, count: number): number {
    const steps = Math.floor(elapsed / FONT_FLIP_MS);
    let font = Math.floor(noise(seed, 0, FONT_FLIP_SALT + letter) * count);
    for (let step = 1; step <= steps; step++) {
        font = (font + 1 + Math.floor(noise(seed, step, FONT_FLIP_SALT + letter) * (count - 1))) % count;
    }
    return font;
}

export function isNegative(elapsed: number, timeLimit: number): boolean {
    return elapsed >= timeLimit * NEGATIVE_FROM && elapsed < timeLimit * NEGATIVE_UNTIL;
}

// The afterimage of NEGATIVE: the word in its negative colors, fading out once the negative is gone
export function afterimageOpacity(elapsed: number, timeLimit: number): number {
    const since = elapsed - timeLimit * NEGATIVE_UNTIL;
    return since >= 0 && since < AFTERIMAGE_MS ? 1 - since / AFTERIMAGE_MS : 0;
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
