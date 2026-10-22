// What the looks of the modifiers (the look.ts in their folders) share. Everything animated depends only on the
// level's seed and the time since the word appeared, so it stands still while the game is paused and looks the same
// after resuming.

export interface Size {
    readonly width: number;
    readonly height: number;
}

export interface Point {
    readonly x: number;
    readonly y: number;
}

export function lerp(from: number, to: number, share: number): number {
    return from + (to - from) * share;
}

// Deterministic value in [0, 1) for a seed, a time step and a salt
export function noise(seed: number, step: number, salt: number): number {
    let hash = Math.imul(Math.floor(seed * 2 ** 31) ^ 0x9e3779b9, 0x85ebca6b);
    hash = Math.imul(hash ^ step ^ (hash >>> 15), 0xc2b2ae35);
    hash = Math.imul(hash ^ (salt * 0x27d4eb2f) ^ (hash >>> 13), 0x165667b1);
    hash ^= hash >>> 16;
    return (hash >>> 0) / 2 ** 32;
}

// Like noise, in [-1, 1)
export function signedNoise(seed: number, step: number, salt: number): number {
    return noise(seed, step, salt) * 2 - 1;
}
