import type { Strength, Tempo } from "../game/challenge.ts";
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

export interface Point {
    readonly x: number;
    readonly y: number;
}

// The word's anchor transform: translate(x, y) rotate(rotation deg) scale(scaleX, scaleY)
export interface AnchorTransform extends Point {
    readonly rotation: number;
    readonly scaleX: number;
    readonly scaleY: number;
}

const MOVING_FONT_SCALE = 0.62;
const MOVING_PERIOD_X_MS = 3000;
const MOVING_PERIOD_Y_MS = 2200;
const MOVING_MARGIN = 10;

const SHAKE_STEP_MS = 60;
// Share of the free area the word jumps around in, times a factor that grows with the strength, and how far it tilts
// with every jump. Like every effect that grows with the strength, at full strength it is 1.5 times what it is at none.
const SHAKE_X = 0.02;
const SHAKE_Y = 0.05;
const SHAKE_FACTOR_GENTLE = 0.6;
const SHAKE_FACTOR_STRONG = 0.9;
const SHAKE_TILT_GENTLE_DEG = 4;
const SHAKE_TILT_STRONG_DEG = 6;
// Font size given up per unit of the shake factor, so the shaking word stays on screen
const SHAKE_FONT_SHRINK = 0.06;

// Pulsing swings between a low and a high scale, both further from 1 with the strength, 1.5 times as far at full
// strength
const PULSE_PERIOD_MS = 350;
const PULSE_LOW_GENTLE = 0.85;
const PULSE_LOW_STRONG = 0.775;
const PULSE_HIGH_GENTLE = 1.08;
const PULSE_HIGH_STRONG = 1.12;

const SCRAMBLE_STEP_MS = 380;
// Shifts the seed for every word of a rule text, so it is not mixed in step with the color word
const WORD_SEED_STEP = 0.37;

const SPIN_MS = 2500;
// ROTATION turns unevenly with the strength: its speed swings by up to this share, once every SPIN_WOBBLE_MS, so at
// full strength it turns at most 1.5 times as fast
const SPIN_WOBBLE = 0.5;
const SPIN_WOBBLE_MS = 700;
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

// LOW TIME: a red frame glows once the timer turns red and gets stronger until the time is up
const LOW_TIME_GLOW = 0.3;
const LOW_TIME_GLOW_START = 0.35;

// Font size factor that keeps the moved, shaken or grown word on screen
export function effectFontScale(modifiers: ReadonlySet<ModifierId>, strength: Strength = {}): number {
    return (
        (modifiers.has("moving") ? MOVING_FONT_SCALE : 1) *
        (modifiers.has("shaky") ? 1 - SHAKE_FONT_SHRINK * shakeFactor(strength.shaky ?? 0) : 1) *
        (modifiers.has("pulsing") ? 1 / pulseRange(strength.pulsing ?? 0).high : 1)
    );
}

// Offset and scale of the word inside `area`, the free rectangle around the screen center. `word` is the space
// the word takes up at scale 1. `tempo` speeds up moving, shaking and pulsing, `strength` widens shaking and pulsing.
// `size` is the zoomed word's size relative to normal: it shakes as much relative to its own size as a normal word.
export function wordMotion(
    modifiers: ReadonlySet<ModifierId>,
    seed: number,
    elapsed: number,
    area: Size,
    word: Size,
    tempo: Tempo = {},
    size = 1,
    strength: Strength = {},
): WordMotion {
    const shake = shakeFactor(strength.shaky ?? 0) * size;
    const shakeX = modifiers.has("shaky") ? area.width * SHAKE_X * shake : 0;
    const shakeY = modifiers.has("shaky") ? area.height * SHAKE_Y * shake : 0;
    let x = 0;
    let y = 0;
    let rotation = 0;
    if (modifiers.has("moving")) {
        // A shaking word needs the shake's amplitude as extra margin, or it leaves the screen at the turning points
        const grown = modifiers.has("pulsing") ? pulseRange(strength.pulsing ?? 0).high : 1;
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
        rotation = shakeTiltDeg(strength.shaky ?? 0) * signedNoise(seed, step, 3);
    }
    const scale = modifiers.has("pulsing")
        ? pulseScale(seed, elapsed * (tempo.pulsing ?? 1), strength.pulsing ?? 0)
        : 1;
    return { x, y, scale, rotation };
}

// How far a shaking word tilts at most, in degrees
export function shakeTiltDeg(strength: number): number {
    return lerp(SHAKE_TILT_GENTLE_DEG, SHAKE_TILT_STRONG_DEG, strength);
}

function shakeFactor(strength: number): number {
    return lerp(SHAKE_FACTOR_GENTLE, SHAKE_FACTOR_STRONG, strength);
}

// Degrees a rotated word has turned since it appeared: a full turn every 2.5 s on average, left or right depending on
// the seed. With strength its speed swings, but it never stops or turns back.
export function spin(seed: number, elapsed: number, strength = 0): number {
    const phase = (2 * Math.PI * elapsed) / SPIN_WOBBLE_MS;
    const wobble = (SPIN_WOBBLE * strength * SPIN_WOBBLE_MS * (1 - Math.cos(phase))) / (2 * Math.PI);
    const turns = (elapsed + wobble) / SPIN_MS;
    return 360 * (seed < 0.5 ? turns : -turns);
}

// A blinking word fades away instead of vanishing at once
export function fadeOpacity(elapsed: number): number {
    return Math.max(0, 1 - elapsed / FADE_MS);
}

export function pulseRange(strength: number): { readonly low: number; readonly high: number } {
    return {
        low: lerp(PULSE_LOW_GENTLE, PULSE_LOW_STRONG, strength),
        high: lerp(PULSE_HIGH_GENTLE, PULSE_HIGH_STRONG, strength),
    };
}

export function pulseScale(seed: number, elapsed: number, strength = 0): number {
    const { low, high } = pulseRange(strength);
    const middle = (low + high) / 2;
    const swing = (high - low) / 2;
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
export function assembleStart(seed: number, letter: number, area: Size, margin: number): Point {
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

// A point given relative to the anchor's untransformed position (the screen center) in the anchor's own
// coordinates, so that something placed there inside the transformed anchor shows at that point on screen
export function toAnchor(point: Point, anchor: AnchorTransform): Point {
    const radians = (anchor.rotation * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const dx = point.x - anchor.x;
    const dy = point.y - anchor.y;
    return {
        x: (dx * cos + dy * sin) / anchor.scaleX,
        y: (-dx * sin + dy * cos) / anchor.scaleY,
    };
}

// The font (an index into `weights`) of a letter of FONT FLIP: a new random one every 200 ms, never the same twice
// in a row, each one as often as its weight says
export function flipFont(seed: number, letter: number, elapsed: number, weights: readonly number[]): number {
    const steps = Math.floor(elapsed / FONT_FLIP_MS);
    let font = weightedIndex(weights, noise(seed, 0, FONT_FLIP_SALT + letter), -1);
    for (let step = 1; step <= steps; step++) {
        font = weightedIndex(weights, noise(seed, step, FONT_FLIP_SALT + letter), font);
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

// Opacity of the red frame for the share of the time that is left, starting below `from`
export function lowTimeGlow(remaining: number, from: number): number {
    if (remaining >= from) return 0;
    const progress = 1 - Math.max(0, remaining) / from;
    return LOW_TIME_GLOW * (LOW_TIME_GLOW_START + (1 - LOW_TIME_GLOW_START) * progress);
}

export function isNegative(elapsed: number, timeLimit: number): boolean {
    return elapsed >= timeLimit * NEGATIVE_FROM && elapsed < timeLimit * NEGATIVE_UNTIL;
}

// The afterimage of NEGATIVE: the word in its negative colors, fading out once the negative is gone
export function afterimageOpacity(elapsed: number, timeLimit: number): number {
    const since = elapsed - timeLimit * NEGATIVE_UNTIL;
    return since >= 0 && since < AFTERIMAGE_MS ? 1 - since / AFTERIMAGE_MS : 0;
}

function lerp(from: number, to: number, share: number): number {
    return from + (to - from) * share;
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
