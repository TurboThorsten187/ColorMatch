import { conflicts, MODIFIER_GROUPS, type ModifierGroupId, TIERS } from "./modifiers.ts";
import type { Rng } from "./random.ts";

// The order in which one game introduces the modifier groups: shuffled per game, but easy before medium before hard
export type Curriculum = readonly ModifierGroupId[];

export const FIRST_INTRO_LEVEL = 5;
export const INTRO_EVERY = 3;
// The level right after an introduction brings the new group back this often, together with a known one. Alone it
// would repeat the introduction level, which no level may do, so there is no practice while levels hold one group.
export const PRACTICE_CHANCE = 0.7;

// Time per level: 3 s at level 1, flattening out towards 1.2 s, then down to 1.0 s in the late game
const BASE_MIN_MS = 1200;
const BASE_RANGE_MS = 1800;
const BASE_DECAY = 0.93;
export const INTRO_BONUS_MS = 1000;
export const EXTRA_GROUP_BONUS_MS = 300;
// A Don't Click level is only sat out, the full time would just be waiting
export const NO_CLICK_TIME_SHARE = 0.6;

// Freshly introduced groups are picked more often; the advantage fades over about ten levels
const FRESH_BOOST = 2;
const FRESH_FADE_LEVELS = 6;
// How likely 1, 2 or 3 groups are on a level with modifiers, cut off at the level's maximum
const COUNT_WEIGHTS = [0.6, 0.3, 0.1];
const PICK_ATTEMPTS = 6;

// After the last introduction the levels keep getting harder until LATE_UNTIL_LEVEL: less time, no more plain
// levels and more groups at once
const LATE_FROM_LEVEL = 40;
const LATE_UNTIL_LEVEL = 80;
const LATE_MIN_DROP_MS = 200;
const LATE_COUNT_WEIGHTS = [0.2, 0.4, 0.4];

// Every few levels a surge stacks more groups than any other level, announced by a banner
export const SURGE_FIRST_LEVEL = 50;
export const SURGE_EVERY = 10;
export const SURGE_GROUP_COUNT = 4;

// The zoomed word starts at a fifth of the normal size and shrinks with every level after its introduction, down to
// a tenth
export const ZOOM_SIZE = 0.2;
export const ZOOM_MIN_SIZE = 0.1;
const ZOOM_SHRINK_PER_LEVEL = 0.04;

export function createCurriculum(rng: Rng): Curriculum {
    return TIERS.flatMap((tier) =>
        shuffle(
            MODIFIER_GROUPS.filter((group) => group.tier === tier).map((group) => group.id),
            rng,
        ),
    );
}

// A surge introduces nothing: the group due on a surge level comes on the level after it
export function introLevel(curriculum: Curriculum, id: ModifierGroupId): number {
    const index = curriculum.indexOf(id);
    if (index < 0) throw new Error(`Modifier group ${id} is missing in the curriculum`);
    const due = FIRST_INTRO_LEVEL + INTRO_EVERY * index;
    return isSurgeLevel(due) ? due + 1 : due;
}

// The group this level introduces, it then comes alone
export function introducedAt(curriculum: Curriculum, level: number): ModifierGroupId | null {
    if (isSurgeLevel(level)) return null;
    const due = isSurgeLevel(level - 1) ? level - 1 : level;
    const offset = due - FIRST_INTRO_LEVEL;
    if (offset < 0 || offset % INTRO_EVERY !== 0) return null;
    return curriculum[offset / INTRO_EVERY] ?? null;
}

export function maxGroupCount(level: number): number {
    return level < 15 ? 1 : level < 30 ? 2 : 3;
}

export function isSurgeLevel(level: number): boolean {
    return level >= SURGE_FIRST_LEVEL && (level - SURGE_FIRST_LEVEL) % SURGE_EVERY === 0;
}

// Outside of introductions and practice, a level stays free of modifiers this often
export function plainChance(level: number): number {
    return Math.max(0.15, 0.45 - 0.01 * (level - FIRST_INTRO_LEVEL)) * (1 - lateShare(level));
}

// A surge gets no extra time for its many groups
export function timeLimitFor(level: number, groupCount: number, intro: boolean): number {
    const bonus = isSurgeLevel(level)
        ? 0
        : (intro ? INTRO_BONUS_MS : 0) + EXTRA_GROUP_BONUS_MS * Math.max(0, groupCount - 1);
    return Math.round(baseLimit(level) + bonus);
}

// Animated modifiers (spin, pulse, shake, movement, fade, scramble) speed up as much as the time limit shrinks:
// normal speed at the first intro level, about twice as fast at level 40 and 2.5 times from level 80 on
export function levelTempo(level: number): number {
    return Math.max(1, baseLimit(FIRST_INTRO_LEVEL) / baseLimit(level));
}

export const TEMPO_CATCH_UP_LEVELS = 8;

// Every modifier starts at normal speed on its intro level and reaches the level's tempo within a few levels, so one
// introduced late speeds up faster than one introduced early
export function tempoFor(level: number, introducedOn: number): number {
    const catchUp = Math.min(1, Math.max(0, (level - introducedOn) / TEMPO_CATCH_UP_LEVELS));
    return 1 - catchUp + catchUp * levelTempo(level);
}

export function zoomSizeFor(level: number, introducedOn: number): number {
    const shrink = 1 - ZOOM_SHRINK_PER_LEVEL * Math.max(0, level - introducedOn);
    return Math.max(ZOOM_MIN_SIZE, ZOOM_SIZE * shrink);
}

function baseLimit(level: number): number {
    return BASE_MIN_MS - LATE_MIN_DROP_MS * lateShare(level) + BASE_RANGE_MS * BASE_DECAY ** (level - 1);
}

// How far the late game has progressed: 0 up to LATE_FROM_LEVEL, 1 from LATE_UNTIL_LEVEL on
function lateShare(level: number): number {
    return Math.min(1, Math.max(0, (level - LATE_FROM_LEVEL) / (LATE_UNTIL_LEVEL - LATE_FROM_LEVEL)));
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
    if (isSurgeLevel(level)) return pick(known, SURGE_GROUP_COUNT, level, curriculum, rng, []);

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
    const late = lateShare(level);
    const weights = COUNT_WEIGHTS.map((weight, i) => weight + (LATE_COUNT_WEIGHTS[i] - weight) * late);
    return weightedIndex(weights.slice(0, maxGroupCount(level)), rng) + 1;
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
