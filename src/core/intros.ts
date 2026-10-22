import { groupById, MODIFIER_GROUPS } from "@/modifiers/registry.ts";
import type { IntroCard, ModifierGroupId, Sign } from "@/modifiers/types.ts";
import type { Challenge } from "./challenge.ts";

// One card per modifier group, both mirrors share one; the cards are part of the group definitions
export type IntroId = ModifierGroupId;

export interface ModifierIntro extends IntroCard {
    readonly id: IntroId;
}

// What a card shows of its group at a moment: the rule sign, or a challenge drawn like in a level
export type IntroExample =
    | { readonly kind: "sign"; readonly sign: Sign }
    | {
          readonly kind: "word";
          readonly challenge: Challenge;
          // The time in the level it plays and that level's time limit, in ms
          readonly elapsed: number;
          readonly timeLimit: number;
          readonly spamCount: number;
      };

// Every example moves the same way, whatever the game's levels do
const EXAMPLE_SEED = 0.37;

export const INTROS: readonly ModifierIntro[] = MODIFIER_GROUPS.map((group) => ({ id: group.id, ...group.intro }));

export function introById(id: IntroId): ModifierIntro {
    const intro = INTROS.find((candidate) => candidate.id === id);
    if (!intro) throw new Error(`Intro ${id} is missing in INTROS`);
    return intro;
}

// The cards a level with these groups needs before it starts, each one only the first time its group shows up
export function newIntros(groups: readonly ModifierGroupId[], seen: readonly IntroId[]): IntroId[] {
    return groups.filter((id) => !seen.includes(id));
}

// The card's example `elapsed` ms after the card appeared, played as its demo says
export function introExample(id: IntroId, elapsed: number): IntroExample {
    const group = groupById(id);
    const { example, demo = {} } = group.intro;
    const time = demo.loopMs ? elapsed % demo.loopMs : elapsed;
    const timeLimit = demo.timeLimitMs ?? Infinity;
    if (example === "sign") {
        const sign = group.sign?.(time / timeLimit);
        if (!sign) throw new Error(`The intro of ${id} shows a sign, but the group has none`);
        return { kind: "sign", sign };
    }
    const variant = demo.variantMs
        ? group.variants[Math.floor(elapsed / demo.variantMs) % group.variants.length]
        : group.variants[0];
    const presses = group.rule?.presses ?? 1;
    const challenge: Challenge = {
        ...example,
        groups: [id],
        modifiers: new Set([variant]),
        expected: example.word === example.color ? "true" : "false",
        presses,
        lockedShare: 0,
        background: null,
        rotationDeg: 0,
        seed: EXAMPLE_SEED,
        tempo: {},
        strength: {},
        second: null,
        size: 1,
        ...demo.challenge,
    };
    // All characters lit stays for two presses before it starts over
    const spamCount = demo.pressMs ? Math.floor(time / demo.pressMs) % (presses + 2) : 0;
    return { kind: "word", challenge, elapsed: time, timeLimit, spamCount };
}
