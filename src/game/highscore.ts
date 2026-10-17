const HIGHSCORE_KEY = "colormatch_highscore";

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

export function loadHighscore(storage: KeyValueStore | null): number {
    try {
        const stored = Number.parseInt(storage?.getItem(HIGHSCORE_KEY) ?? "", 10);
        return Number.isNaN(stored) ? 0 : stored;
    } catch {
        return 0;
    }
}

export function saveHighscore(storage: KeyValueStore | null, score: number): void {
    if (score <= loadHighscore(storage)) return;

    try {
        storage?.setItem(HIGHSCORE_KEY, String(score));
    } catch {
        // See above: not persisting is acceptable
    }
}

export function clearHighscore(storage: KeyValueStore | null): void {
    try {
        storage?.removeItem(HIGHSCORE_KEY);
    } catch {
        // See above: storage that cannot be written holds no highscore either
    }
}
