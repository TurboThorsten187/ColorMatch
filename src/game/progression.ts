import { conflicts, MODIFIER_GROUPS, type ModifierGroupId, TIERS } from "./modifiers.ts";
import type { Rng } from "./random.ts";

// The order in which one game introduces the modifier groups: shuffled per game, but easy before medium before hard
export type Curriculum = readonly ModifierGroupId[];

export const FIRST_INTRO_LEVEL = 5;
export const INTRO_EVERY = 3;
// The level right after an introduction brings the new group back this often, together with a known one. Alone it
// would repeat the introduction level, which no level may do, so there is no practice while levels hold one group.
export const PRACTICE_CHANCE = 0.7;

// Time per level: 3 s at level 1, flattening out towards 1.2 s
const BASE_MIN_MS = 1200;
const BASE_RANGE_MS = 1800;
const BASE_DECAY = 0.93;
export const INTRO_BONUS_MS = 1000;
export const EXTRA_GROUP_BONUS_MS = 300;

// Freshly introduced groups are picked more often; the advantage fades over about ten levels
const FRESH_BOOST = 2;
const FRESH_FADE_LEVELS = 6;
// How likely 1, 2 or 3 groups are on a level with modifiers, cut off at the level's maximum
const COUNT_WEIGHTS = [0.6, 0.3, 0.1];
const PICK_ATTEMPTS = 6;

export function createCurriculum(rng: Rng): Curriculum {
    return TIERS.flatMap((tier) =>
        shuffle(
            MODIFIER_GROUPS.filter((group) => group.tier === tier).map((group) => group.id),
            rng,
        ),
    );
}

export function introLevel(curriculum: Curriculum, id: ModifierGroupId): number {
    const index = curriculum.indexOf(id);
    if (index < 0) throw new Error(`Modifier group ${id} is missing in the curriculum`);
    return FIRST_INTRO_LEVEL + INTRO_EVERY * index;
}

// The group this level introduces, it then comes alone
export function introducedAt(curriculum: Curriculum, level: number): ModifierGroupId | null {
    const offset = level - FIRST_INTRO_LEVEL;
    if (offset < 0 || offset % INTRO_EVERY !== 0) return null;
    return curriculum[offset / INTRO_EVERY] ?? null;
}

export function maxGroupCount(level: number): number {
    return level < 15 ? 1 : level < 30 ? 2 : 3;
}

// Outside of introductions and practice, a level stays free of modifiers this often
export function plainChance(level: number): number {
    return Math.max(0.15, 0.45 - 0.01 * (level - FIRST_INTRO_LEVEL));
}

export function timeLimitFor(level: number, groupCount: number, intro: boolean): number {
    const base = BASE_MIN_MS + BASE_RANGE_MS * BASE_DECAY ** (level - 1);
    const bonus = (intro ? INTRO_BONUS_MS : 0) + EXTRA_GROUP_BONUS_MS * Math.max(0, groupCount - 1);
    return Math.round(base + bonus);
}

// The modifier groups of a level. `previous` are the groups of the level before, never repeated as they were.
export function pickGroups(
    level: number,
    curriculum: Curriculum,
    previous: readonly ModifierGroupId[],
    rng: Rng,
): ModifierGroupId[] {
    const intro = introducedAt(curriculum, level);
    if (intro) return [intro];

    const known = curriculum.filter((id) => introLevel(curriculum, id) < level);
    const newest = known.at(-1);
    if (!newest) return [];

    const practice = level === introLevel(curriculum, newest) + 1 && maxGroupCount(level) >= 2;
    for (let attempt = 0; attempt < PICK_ATTEMPTS; attempt++) {
        let picked: ModifierGroupId[];
        if (practice && rng() < PRACTICE_CHANCE) {
            picked = pick(known, 2, level, curriculum, rng, [newest]);
        } else if (rng() < plainChance(level)) {
            picked = [];
        } else {
            picked = pick(known, randomCount(level, rng), level, curriculum, rng, []);
        }
        if (picked.length === 0 || !sameGroups(picked, previous)) return picked;
    }
    return [];
}

function pick(
    pool: readonly ModifierGroupId[],
    count: number,
    level: number,
    curriculum: Curriculum,
    rng: Rng,
    forced: readonly ModifierGroupId[],
): ModifierGroupId[] {
    const picked = [...forced];
    const candidates = pool.filter((id) => !picked.includes(id));
    while (picked.length < count && candidates.length > 0) {
        const weights = candidates.map(
            (id) => 1 + FRESH_BOOST * Math.exp(-(level - introLevel(curriculum, id)) / FRESH_FADE_LEVELS),
        );
        const [candidate] = candidates.splice(weightedIndex(weights, rng), 1);
        if (!picked.some((other) => conflicts(candidate, other))) picked.push(candidate);
    }
    return picked;
}

function randomCount(level: number, rng: Rng): number {
    return weightedIndex(COUNT_WEIGHTS.slice(0, maxGroupCount(level)), rng) + 1;
}

function weightedIndex(weights: readonly number[], rng: Rng): number {
    let rest = rng() * weights.reduce((sum, weight) => sum + weight, 0);
    for (let i = 0; i < weights.length; i++) {
        rest -= weights[i];
        if (rest < 0) return i;
    }
    return weights.length - 1;
}

function sameGroups(a: readonly ModifierGroupId[], b: readonly ModifierGroupId[]): boolean {
    return a.length === b.length && a.every((id) => b.includes(id));
}

function shuffle<T>(items: readonly T[], rng: Rng): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}
