import { MODIFIER_GROUPS } from "@/modifiers/registry.ts";
import type { ModifierId } from "@/modifiers/types.ts";
import type { Challenge, ExpectedInput } from "./challenge.ts";

// A challenge for tests: the red word in red ink with the given modifiers, their groups and the presses and locked
// start of their rule, as createChallenge would make them
export function testChallenge(expected: ExpectedInput, modifiers: readonly ModifierId[] = []): Challenge {
    const groups = MODIFIER_GROUPS.filter((group) => group.variants.some((id) => modifiers.includes(id)));
    const rule = groups.find((group) => group.rule)?.rule;
    return {
        word: "red",
        color: "red",
        groups: groups.map((group) => group.id),
        modifiers: new Set(modifiers),
        expected,
        presses: rule?.presses ?? 1,
        lockedShare: rule?.lockedShare ?? 0,
        background: null,
        rotationDeg: 0,
        seed: 0,
        tempo: {},
        strength: {},
        second: null,
        size: 1,
    };
}
