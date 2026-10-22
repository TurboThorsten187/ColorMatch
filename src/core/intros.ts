import { MODIFIER_GROUPS } from "@/modifiers/registry.ts";
import type { IntroCard, ModifierGroupId } from "@/modifiers/types.ts";

// One card per modifier group, both mirrors share one; the cards are part of the group definitions
export type IntroId = ModifierGroupId;

export interface ModifierIntro extends IntroCard {
    readonly id: IntroId;
}

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
