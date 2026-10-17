import type { Rng } from "./random.ts";

export type ModifierId =
    // Change which input is correct
    | "invertInput"
    | "noClick"
    | "spam"
    // Only change how the challenge looks
    | "mirrorVertical"
    | "mirrorHorizontal"
    | "background"
    | "blink"
    | "invertColors"
    | "blur"
    | "rotation";

interface ModifierDefinition {
    readonly id: ModifierId;
    readonly minLevel: number;
    readonly conflictsWith: readonly ModifierId[];
}

export const MODIFIERS: readonly ModifierDefinition[] = [
    { id: "invertInput", minLevel: 10, conflictsWith: ["noClick", "spam"] },
    { id: "noClick", minLevel: 10, conflictsWith: ["invertInput", "spam"] },
    {
        id: "spam",
        minLevel: 15,
        conflictsWith: ["noClick", "invertInput", "background", "blink", "invertColors"],
    },
    { id: "mirrorVertical", minLevel: 5, conflictsWith: [] },
    { id: "mirrorHorizontal", minLevel: 5, conflictsWith: [] },
    { id: "background", minLevel: 5, conflictsWith: ["spam"] },
    { id: "blink", minLevel: 10, conflictsWith: ["spam"] },
    { id: "invertColors", minLevel: 30, conflictsWith: ["spam"] },
    { id: "blur", minLevel: 10, conflictsWith: [] },
    { id: "rotation", minLevel: 10, conflictsWith: [] },
];

const MAX_MODIFIERS = 3;

// One more modifier slot every 10 levels (up to 3); the actual count is random, zero included
export function maxModifierCount(level: number): number {
    return Math.min(MAX_MODIFIERS, Math.floor(level / 10) + 1);
}

export function pickModifiers(level: number, rng: Rng): ReadonlySet<ModifierId> {
    const count = Math.floor(rng() * (maxModifierCount(level) + 1));
    const available = MODIFIERS.filter((modifier) => level >= modifier.minLevel);
    const picked: ModifierDefinition[] = [];

    while (picked.length < count && available.length > 0) {
        const [candidate] = available.splice(Math.floor(rng() * available.length), 1);
        const conflict = picked.some(
            (other) => other.conflictsWith.includes(candidate.id) || candidate.conflictsWith.includes(other.id),
        );
        if (!conflict) {
            picked.push(candidate);
        }
    }

    return new Set(picked.map((modifier) => modifier.id));
}
