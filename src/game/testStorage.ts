import type { KeyValueStore } from "./highscore.ts";

// Storage doubles for the persistence tests

export function memoryStorage(): KeyValueStore {
    const data = new Map<string, string>();
    return {
        getItem: (key) => data.get(key) ?? null,
        setItem: (key, value) => void data.set(key, value),
        removeItem: (key) => void data.delete(key),
    };
}

function blocked(): never {
    throw new Error("blocked");
}

export const blockedStorage: KeyValueStore = {
    getItem: blocked,
    setItem: blocked,
    removeItem: blocked,
};
