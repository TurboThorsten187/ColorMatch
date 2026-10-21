import type { Mode } from "./progression.ts";

// Every mode keeps its own highscore
const HIGHSCORE_KEYS: Readonly<Record<Mode, string>> = {
    normal: "colormatch_highscore",
    hardcore: "colormatch_highscore_hardcore",
};

// HARDCORE opens once a normal game has cleared this level, like the LEVEL 50 award
export const HARDCORE_UNLOCK_SCORE = 50;

export function isHardcoreUnlocked(normalHighscore: number): boolean {
    return normalHighscore >= HARDCORE_UNLOCK_SCORE;
}

export type KeyValueStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;

// Storage can be unavailable or throw (private mode, blocked cookies). The game must keep
// running in that case, the highscore is then simply not persisted.

export function browserStorage(): KeyValueStore | null {
    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

export function loadHighscore(storage: KeyValueStore | null, mode: Mode = "normal"): number {
    try {
        const stored = Number.parseInt(storage?.getItem(HIGHSCORE_KEYS[mode]) ?? "", 10);
        return Number.isNaN(stored) ? 0 : stored;
    } catch {
        return 0;
    }
}

export function saveHighscore(storage: KeyValueStore | null, score: number, mode: Mode = "normal"): void {
    if (score <= loadHighscore(storage, mode)) return;

    try {
        storage?.setItem(HIGHSCORE_KEYS[mode], String(score));
    } catch {
        // See above: not persisting is acceptable
    }
}

// Clears the highscores of all modes
export function clearHighscore(storage: KeyValueStore | null): void {
    try {
        for (const key of Object.values(HIGHSCORE_KEYS)) storage?.removeItem(key);
    } catch {
        // See above: storage that cannot be written holds no highscore either
    }
}
