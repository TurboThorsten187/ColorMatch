// Source of randomness in [0, 1). Injected so that tests can make the game deterministic.
export type Rng = () => number;

export function pick<T>(rng: Rng, items: readonly T[]): T {
    if (items.length === 0) {
        throw new Error("Cannot pick from an empty list");
    }
    return items[Math.floor(rng() * items.length)];
}
