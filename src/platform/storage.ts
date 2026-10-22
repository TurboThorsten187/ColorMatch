import { bestHighscores } from "@/core/highscore.ts";
import { NEW_SAVE, parseSave, type SaveData, serializeSave } from "@/core/save.ts";

export type KeyValueStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;

// Storage can be unavailable or throw (private mode, blocked cookies). The game must keep running in that case, it
// then simply forgets everything when the tab is closed.

const SAVE_KEY = "colormatch_save";

// Where the game kept its data before SAVE_VERSION 1, which started every save anew
const OLD_KEYS: readonly string[] = [
    "colormatch_highscore",
    "colormatch_highscore_hardcore",
    "colormatch_settings",
    "colormatch_stats",
    "colormatch_tutorial",
];

export function browserStorage(): KeyValueStore | null {
    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

export function loadSave(storage: KeyValueStore | null): SaveData {
    try {
        return parseSave(JSON.parse(storage?.getItem(SAVE_KEY) ?? "null"));
    } catch {
        // Blocked storage or broken JSON, same as a new player
        return NEW_SAVE;
    }
}

// A highscore never goes down: another tab may have saved a better one meanwhile
export function writeSave(storage: KeyValueStore | null, save: SaveData): void {
    const highscores = bestHighscores(save.highscores, loadSave(storage).highscores);
    try {
        storage?.setItem(SAVE_KEY, serializeSave({ ...save, highscores }));
    } catch {
        // See above: not persisting is acceptable
    }
}

export function clearSave(storage: KeyValueStore | null): void {
    try {
        storage?.removeItem(SAVE_KEY);
    } catch {
        // Storage that cannot be written holds no save either
    }
}

export function removeOldSaves(storage: KeyValueStore | null): void {
    try {
        for (const key of OLD_KEYS) storage?.removeItem(key);
    } catch {
        // Blocked storage keeps nothing that could be left over
    }
}
