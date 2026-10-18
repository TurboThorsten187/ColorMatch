import type { Rng } from "../game/random.ts";

// Losing a level: the screen shakes, the word bursts into falling pixel blocks, then the picture shuts off like an
// old CRT, squashed to a white line and then to a dot. Everything depends only on the time since the loss.

const FRAME_FADE_MS = 400;
const SHAKE_MS = 260;
const SHAKE_STEPS = 8;
export const SHATTER_AT_MS = 120;
const LABEL_POP_MS = 300;
const FALL_MS = 750;
// The picture starts to shut off
export const SQUASH_AT_MS = SHATTER_AT_MS + FALL_MS;
const SQUASH_MS = 200;
const SHRINK_MS = 160;
const FADE_MS = 180;
const DARK_MS = 150;
export const LOSS_ANIMATION_MS = SQUASH_AT_MS + SQUASH_MS + SHRINK_MS + FADE_MS + DARK_MS;
// Then the game over screen switches on: the title flickers up, the scores follow, the buttons come last
export const POWER_ON_MS = 260;
export const BUTTONS_APPEAR_MS = 400;

// Size of the picture as a white line and as a dot
const LINE_SCALE = 0.006;
const DOT_SCALE = 0.02;

// Block physics relative to the screen height, per second and per second squared
const GRAVITY = 2.45;
const MIN_RISE = 0.11;
const MAX_RISE = 0.6;
const DRIFT = 0.075;
// How fast blocks fly apart, relative to their distance from the middle of the word
const MIN_SPREAD = 1.2;
const MAX_SPREAD = 2.6;
// A drawn pixel has at least this alpha value (0 to 255)
const INK_ALPHA = 120;

export interface LossFrame {
    // Red border around the screen
    readonly frameOpacity: number;
    // Index into the shake offsets, null when the screen is still
    readonly shakeStep: number | null;
    // The word is gone, its blocks fall
    readonly shattered: boolean;
    readonly labelScale: number;
    readonly labelOpacity: number;
    readonly scaleX: number;
    readonly scaleY: number;
    // White overlay that turns the squashed picture into a bright line
    readonly whiteout: number;
    readonly opacity: number;
}

export interface Block {
    readonly x: number;
    readonly y: number;
    // Pixels per second
    readonly vx: number;
    readonly vy: number;
}

export const SHAKE_OFFSETS = SHAKE_STEPS - 1;

export function lossFrame(elapsed: number): LossFrame {
    const label = progress(elapsed, SHATTER_AT_MS, LABEL_POP_MS);
    const squash = progress(elapsed, SQUASH_AT_MS, SQUASH_MS);
    const shrink = progress(elapsed, SQUASH_AT_MS + SQUASH_MS, SHRINK_MS);
    const step = Math.floor(elapsed / (SHAKE_MS / SHAKE_STEPS));
    return {
        frameOpacity: 1 - easeOut(progress(elapsed, 0, FRAME_FADE_MS)),
        // The last step is the screen back in place
        shakeStep: elapsed >= 0 && step < SHAKE_OFFSETS ? step : null,
        shattered: elapsed >= SHATTER_AT_MS,
        // Pops up beyond its size and settles
        labelScale: label < 0.5 ? lerp(0.6, 1.15, easeOut(label * 2)) : lerp(1.15, 1, easeOut(label * 2 - 1)),
        labelOpacity: Math.min(1, label * 2),
        scaleX: lerp(1, DOT_SCALE, easeIn(shrink)),
        scaleY: lerp(1, LINE_SCALE, easeIn(squash)),
        whiteout: squash,
        opacity: 1 - progress(elapsed, SQUASH_AT_MS + SQUASH_MS + SHRINK_MS, FADE_MS),
    };
}

// One block per `size` grid cell whose center pixel is drawn in `rgba` (RGBA bytes of a width x height image).
// Blocks fly apart from the middle of the word, jump up a little and fall.
export function wordBlocks(rgba: ArrayLike<number>, width: number, height: number, size: number, rng: Rng): Block[] {
    const cells: { x: number; y: number }[] = [];
    for (let y = 0; y + size <= height; y += size) {
        for (let x = 0; x + size <= width; x += size) {
            const center = (Math.floor(y + size / 2) * width + Math.floor(x + size / 2)) * 4;
            if (rgba[center + 3] > INK_ALPHA) cells.push({ x, y });
        }
    }
    const middle = cells.reduce((sum, cell) => sum + cell.x, 0) / Math.max(1, cells.length);
    return cells.map(({ x, y }) => ({
        x,
        y,
        vx: (x - middle) * between(rng, MIN_SPREAD, MAX_SPREAD) + between(rng, -DRIFT, DRIFT) * height,
        vy: -between(rng, MIN_RISE, MAX_RISE) * height,
    }));
}

// Blocks scale with the word, about seven per letter height
export function blockSize(fontSize: number): number {
    return Math.max(4, Math.round(fontSize / 7));
}

export function blockAt(block: Block, elapsed: number, height: number): { x: number; y: number } {
    const seconds = Math.max(0, elapsed - SHATTER_AT_MS) / 1000;
    return {
        x: block.x + block.vx * seconds,
        y: block.y + block.vy * seconds + 0.5 * GRAVITY * height * seconds * seconds,
    };
}

// The blocks fade out while they fall, they are gone before the picture shuts off
export function blocksOpacity(elapsed: number): number {
    if (elapsed < SHATTER_AT_MS) return 0;
    return Math.max(0, 1 - progress(elapsed, SHATTER_AT_MS, FALL_MS) ** 2);
}

function progress(elapsed: number, from: number, duration: number): number {
    return Math.min(1, Math.max(0, (elapsed - from) / duration));
}

function lerp(from: number, to: number, t: number): number {
    // Exactly `to` at the end, so finished values compare equal
    return from * (1 - t) + to * t;
}

function easeIn(t: number): number {
    return t * t;
}

function easeOut(t: number): number {
    return 1 - (1 - t) * (1 - t);
}

function between(rng: Rng, min: number, max: number): number {
    return min + rng() * (max - min);
}
