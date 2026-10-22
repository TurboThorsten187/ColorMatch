// Source of randomness in [0, 1). Injected so that tests can make the game deterministic.
export type Rng = () => number;

export function pick<T>(rng: Rng, items: readonly T[]): T {
    if (items.length === 0) {
        throw new Error("Cannot pick from an empty list");
    }
    return items[Math.floor(rng() * items.length)];
}

// A repeatable Rng: the same seed gives the same numbers every time (mulberry32)
export function seededRng(seed: number): Rng {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let hash = Math.imul(state ^ (state >>> 15), state | 1);
        hash ^= hash + Math.imul(hash ^ (hash >>> 7), hash | 61);
        return ((hash ^ (hash >>> 14)) >>> 0) / 2 ** 32;
    };
}
