export type ModifierId =
    // Change which input is correct
    | "invertInput"
    | "noClick"
    | "spam"
    // Only change how the challenge looks
    | "mirrorVertical"
    | "mirrorHorizontal"
    // Both mirrors at once: the word stands on its head
    | "mirrorBoth"
    | "background"
    | "blink"
    | "blur"
    | "rotation"
    | "moving"
    | "scrambled"
    | "shaky"
    | "pulsing";

// Modifiers are introduced, picked and explained per group; both mirrors form one group
export type ModifierGroupId =
    | "mirror"
    | "rotation"
    | "pulsing"
    | "shaky"
    | "background"
    | "blur"
    | "moving"
    | "noClick"
    | "blink"
    | "scrambled"
    | "invertInput"
    | "spam";

export type Tier = "easy" | "medium" | "hard";

export interface ModifierGroup {
    readonly id: ModifierGroupId;
    // Every game introduces all easy groups first, then the medium and then the hard ones
    readonly tier: Tier;
    // A level with this group gets one of these modifiers
    readonly variants: readonly ModifierId[];
    // Changes which input is correct; a level has at most one of these
    readonly rule: boolean;
    readonly conflictsWith: readonly ModifierGroupId[];
}

export const TIERS: readonly Tier[] = ["easy", "medium", "hard"];

function group(
    id: ModifierGroupId,
    tier: Tier,
    variants: readonly ModifierId[],
    { rule = false, conflictsWith = [] as readonly ModifierGroupId[] } = {},
): ModifierGroup {
    return { id, tier, variants, rule, conflictsWith };
}

export const MODIFIER_GROUPS: readonly ModifierGroup[] = [
    group("mirror", "easy", ["mirrorVertical", "mirrorHorizontal", "mirrorBoth"]),
    group("rotation", "easy", ["rotation"]),
    group("pulsing", "easy", ["pulsing"]),
    group("shaky", "easy", ["shaky"]),
    group("background", "medium", ["background"]),
    group("blur", "medium", ["blur"]),
    group("moving", "medium", ["moving"]),
    group("noClick", "medium", ["noClick"], { rule: true }),
    group("blink", "medium", ["blink"]),
    group("scrambled", "hard", ["scrambled"]),
    group("invertInput", "hard", ["invertInput"], { rule: true }),
    // SPAM! replaces the word, so nothing that is about the word or its color makes sense with it
    group("spam", "hard", ["spam"], {
        rule: true,
        conflictsWith: ["background", "blink", "scrambled"],
    }),
];

export function groupById(id: ModifierGroupId): ModifierGroup {
    const found = MODIFIER_GROUPS.find((candidate) => candidate.id === id);
    if (!found) throw new Error(`Modifier group ${id} is missing in MODIFIER_GROUPS`);
    return found;
}

export function conflicts(a: ModifierGroupId, b: ModifierGroupId): boolean {
    const first = groupById(a);
    const second = groupById(b);
    return (first.rule && second.rule) || first.conflictsWith.includes(b) || second.conflictsWith.includes(a);
}

// The groups of a level's modifiers, in list order
export function groupsOf(modifiers: ReadonlySet<ModifierId>): ModifierGroupId[] {
    return MODIFIER_GROUPS.filter((candidate) => candidate.variants.some((id) => modifiers.has(id))).map(
        (candidate) => candidate.id,
    );
}
