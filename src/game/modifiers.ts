export type ModifierId =
    // Change which input is correct
    | "invertInput"
    | "noClick"
    | "spam"
    // Two words, the answer says whether both are true or both false
    | "twoWords"
    // A press before the WAIT sign turns into NOW is a miss
    | "wait"
    // The answer needs two taps
    | "doubleTap"
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
    | "pulsing"
    // The left half of the word, mirrored onto its right half
    | "splitMirror"
    // The letters fly in from the screen edges
    | "assemble"
    // Every letter keeps switching its font
    | "fontFlip"
    // The word is tiny
    | "zoom"
    // The timer fills up instead of running down
    | "countUp"
    // The whole screen flashes as its photo negative
    | "negative";

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
    | "spam"
    | "splitMirror"
    | "assemble"
    | "fontFlip"
    | "zoom"
    | "countUp"
    | "negative"
    | "twoWords"
    | "wait"
    | "doubleTap";

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
    // Blurs, shrinks or shakes the shapes in the letters past recognition, so colorblind games leave the group out
    readonly hidesShapes: boolean;
}

export const TIERS: readonly Tier[] = ["easy", "medium", "hard"];

function group(
    id: ModifierGroupId,
    tier: Tier,
    variants: readonly ModifierId[],
    { rule = false, conflictsWith = [] as readonly ModifierGroupId[], hidesShapes = false } = {},
): ModifierGroup {
    return { id, tier, variants, rule, conflictsWith, hidesShapes };
}

export const MODIFIER_GROUPS: readonly ModifierGroup[] = [
    group("mirror", "easy", ["mirrorVertical", "mirrorHorizontal", "mirrorBoth"]),
    group("rotation", "easy", ["rotation"]),
    group("pulsing", "easy", ["pulsing"]),
    group("shaky", "easy", ["shaky"], { hidesShapes: true }),
    group("background", "medium", ["background"]),
    group("blur", "medium", ["blur"], { hidesShapes: true }),
    group("moving", "medium", ["moving"], { hidesShapes: true }),
    group("noClick", "medium", ["noClick"], { rule: true }),
    group("blink", "medium", ["blink"]),
    group("scrambled", "hard", ["scrambled"]),
    group("invertInput", "hard", ["invertInput"], { rule: true }),
    // SPAM! replaces the word, so nothing that is about the word or its color makes sense with it
    group("spam", "medium", ["spam"], {
        rule: true,
        conflictsWith: ["background", "blink", "scrambled", "splitMirror"],
    }),
    group("zoom", "easy", ["zoom"], { hidesShapes: true }),
    // Half of a scrambled word is too few letters to recognize it
    group("splitMirror", "easy", ["splitMirror"], { conflictsWith: ["scrambled"] }),
    group("countUp", "easy", ["countUp"]),
    // The word would fade before its letters have arrived
    group("assemble", "medium", ["assemble"], { conflictsWith: ["blink"] }),
    group("fontFlip", "medium", ["fontFlip"]),
    // The word would be gone before the negative is over, so it would show almost only in the wrong colors
    group("negative", "medium", ["negative"], { conflictsWith: ["blink"] }),
    // Blink fades the rule tags too, so NOW would never show
    group("wait", "hard", ["wait"], { rule: true, conflictsWith: ["blink"] }),
    group("doubleTap", "hard", ["doubleTap"], { rule: true }),
    // Two words and two inks are too much to read before they fade
    group("twoWords", "hard", ["twoWords"], { rule: true, conflictsWith: ["blink"] }),
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
