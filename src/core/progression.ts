import { conflicts, groupById, MODIFIER_GROUPS, type ModifierGroupId, type Tier, TIERS } from "./modifiers.ts";
import type { Rng } from "./random.ts";

// The order in which one game introduces the modifier groups: shuffled per game, but easy before medium before hard
export type Curriculum = readonly ModifierGroupId[];

export const FIRST_INTRO_LEVEL = 5;
export const INTRO_EVERY = 3;
// The level right after an introduction brings the new group back this often, together with a known one. Alone it
// would repeat the introduction level, which no level may do, so there is no practice while levels hold one group.
export const PRACTICE_CHANCE = 0.7;

// Time per level: 3 s at level 1, down to 1 s at LATE_UNTIL_LEVEL along a gentle bend that flattens out towards the end
const BASE_MIN_MS = 1000;
const BASE_RANGE_MS = 2000;
const BASE_BEND = 1.5;
export const INTRO_BONUS_MS = 1000;
// Every group of a level brings extra time, the harder its tier the more
export const EXTRA_TIME_MS: Readonly<Record<Tier, number>> = { easy: 200, medium: 300, hard: 400 };
// A Don't Click level is only sat out, the full time would just be waiting
export const NO_CLICK_TIME_SHARE = 0.6;
// DUO has two words and two inks to read, it gets this on top of its extra time, on a surge too
export const DUO_EXTRA_MS = 1500;

// Freshly introduced groups are picked more often; the advantage fades over about ten levels
const FRESH_BOOST = 2;
const FRESH_FADE_LEVELS = 6;
// Every COUNT_GROWS_EVERY levels one more group may share a level, starting with one
const COUNT_GROWS_EVERY = 12;
// How likely 1, 2, 3 or more groups are early on, cut off at the level's maximum; above three each count is half as
// likely as the one before
const EARLY_COUNT_WEIGHTS = [0.6, 0.3, 0.1];
const PICK_ATTEMPTS = 6;

// From LATE_FROM_LEVEL the levels get harder until LATE_UNTIL_LEVEL: plain levels die out and every count up to the
// maximum becomes as likely as any other
const LATE_FROM_LEVEL = 40;
const LATE_UNTIL_LEVEL = 80;

// Every few levels a surge stacks more groups than any other level, announced by a banner: five on the first, one
// more on each after it, as many as go together. It always lasts the same time, however many groups it stacks.
export const SURGE_FIRST_LEVEL = 50;
export const SURGE_EVERY = 10;
export const SURGE_FIRST_GROUP_COUNT = 5;
export const SURGE_TIME_MS = 1300;

// HARDCORE introduces nothing: every group may come from level 1, with the time at its minimum, tempo, strength and
// zoom at their full and the count mixed as in the late game. One more group may share a level every few levels, and
// surges come earlier and more often.
export type Mode = "normal" | "hardcore";
const HARDCORE_COUNT_GROWS_EVERY = 3;
export const HARDCORE_SURGE_FIRST_LEVEL = 10;
export const HARDCORE_SURGE_EVERY = 5;

// The zoomed word starts at a fifth of the normal size and shrinks with every level after its introduction, down to
// a tenth
export const ZOOM_SIZE = 0.2;
export const ZOOM_MIN_SIZE = 0.1;
const ZOOM_SHRINK_PER_LEVEL = 0.04;

export function createCurriculum(rng: Rng, colorblind = false): Curriculum {
    return TIERS.flatMap((tier) =>
        shuffle(
            MODIFIER_GROUPS.filter((group) => group.tier === tier && !(colorblind && group.hidesShapes)).map(
                (group) => group.id,
            ),
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
export function introducedAt(curriculum: Curriculum, level: number, mode: Mode = "normal"): ModifierGroupId | null {
    if (mode === "hardcore" || isSurgeLevel(level)) return null;
    const due = isSurgeLevel(level - 1) ? level - 1 : level;
    const offset = due - FIRST_INTRO_LEVEL;
    if (offset < 0 || offset % INTRO_EVERY !== 0) return null;
    return curriculum[offset / INTRO_EVERY] ?? null;
}

export function maxGroupCount(level: number, mode: Mode = "normal"): number {
    const every = mode === "hardcore" ? HARDCORE_COUNT_GROWS_EVERY : COUNT_GROWS_EVERY;
    return 1 + Math.floor((level - 1) / every);
}

function surgeRhythm(mode: Mode): { first: number; every: number } {
    return mode === "hardcore"
        ? { first: HARDCORE_SURGE_FIRST_LEVEL, every: HARDCORE_SURGE_EVERY }
        : { first: SURGE_FIRST_LEVEL, every: SURGE_EVERY };
}

export function isSurgeLevel(level: number, mode: Mode = "normal"): boolean {
    const { first, every } = surgeRhythm(mode);
    return level >= first && (level - first) % every === 0;
}

// How many groups a surge level asks for; fewer come when no more known groups go together
export function surgeGroupCount(level: number, mode: Mode = "normal"): number {
    const { first, every } = surgeRhythm(mode);
    return SURGE_FIRST_GROUP_COUNT + Math.floor((level - first) / every);
}

// Outside of introductions and practice, a level stays free of modifiers this often
export function plainChance(level: number, mode: Mode = "normal"): number {
    if (mode === "hardcore") return 0;
    return Math.max(0.15, 0.45 - 0.01 * (level - FIRST_INTRO_LEVEL)) * (1 - lateShare(level));
}

// Every group brings the extra time of its tier, the first one too; a surge has its fixed time instead
export function timeLimitFor(
    level: number,
    groups: readonly ModifierGroupId[],
    intro: boolean,
    mode: Mode = "normal",
): number {
    const duo = groups.includes("twoWords") ? DUO_EXTRA_MS : 0;
    if (isSurgeLevel(level, mode)) return SURGE_TIME_MS + duo;
    const base = mode === "hardcore" ? BASE_MIN_MS : baseLimit(level);
    const extra = groups.reduce((sum, id) => sum + EXTRA_TIME_MS[groupById(id).tier], 0);
    return Math.round(base + (intro ? INTRO_BONUS_MS : 0) + extra + duo);
}

// Animated modifiers (spin, pulse, shake, movement, fade, scramble) speed up along with the shrinking time limit:
// normal speed at the first intro level, MAX_TEMPO times as fast once the time limit is at its minimum
export const MAX_TEMPO = 1.5;
const FULL_SHRINK = baseLimit(FIRST_INTRO_LEVEL) / baseLimit(LATE_UNTIL_LEVEL);

export function levelTempo(level: number): number {
    const shrink = Math.max(1, baseLimit(FIRST_INTRO_LEVEL) / baseLimit(level));
    return 1 + ((MAX_TEMPO - 1) * (shrink - 1)) / (FULL_SHRINK - 1);
}

export const TEMPO_CATCH_UP_LEVELS = 8;

// Every modifier starts at normal speed on its intro level and reaches the level's tempo within a few levels, so one
// introduced late speeds up faster than one introduced early. Hardcore runs at full speed from level 1.
export function tempoFor(level: number, introducedOn: number, mode: Mode = "normal"): number {
    if (mode === "hardcore") return MAX_TEMPO;
    const catchUp = Math.min(1, Math.max(0, (level - introducedOn) / TEMPO_CATCH_UP_LEVELS));
    return 1 - catchUp + catchUp * levelTempo(level);
}

// Growing modifiers get stronger along with the tempo: 0 on their intro level, 1 once the tempo is at its maximum
export function strengthFor(level: number, introducedOn: number, mode: Mode = "normal"): number {
    return Math.min(1, (tempoFor(level, introducedOn, mode) - 1) / (MAX_TEMPO - 1));
}

export function zoomSizeFor(level: number, introducedOn: number, mode: Mode = "normal"): number {
    if (mode === "hardcore") return ZOOM_MIN_SIZE;
    const shrink = 1 - ZOOM_SHRINK_PER_LEVEL * Math.max(0, level - introducedOn);
    return Math.max(ZOOM_MIN_SIZE, ZOOM_SIZE * shrink);
}

function baseLimit(level: number): number {
    const left = Math.max(0, (LATE_UNTIL_LEVEL - level) / (LATE_UNTIL_LEVEL - 1));
    return BASE_MIN_MS + BASE_RANGE_MS * left ** BASE_BEND;
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
    mode: Mode = "normal",
): ModifierGroupId[] {
    const intro = introducedAt(curriculum, level, mode);
    if (intro) return [intro];

    const hardcore = mode === "hardcore";
    const known = hardcore ? curriculum : curriculum.filter((id) => introLevel(curriculum, id) < level);
    const newest = known.at(-1);
    if (!newest) return [];
    // Without introductions nothing is fresh, every group is as likely as any other
    const weight = (id: ModifierGroupId): number =>
        hardcore ? 1 : 1 + FRESH_BOOST * Math.exp(-(level - introLevel(curriculum, id)) / FRESH_FADE_LEVELS);
    if (isSurgeLevel(level, mode)) return pick(known, surgeGroupCount(level, mode), weight, rng, []);

    const practice = !hardcore && level === introLevel(curriculum, newest) + 1 && maxGroupCount(level) >= 2;
    for (let attempt = 0; attempt < PICK_ATTEMPTS; attempt++) {
        let picked: ModifierGroupId[];
        if (practice && rng() < PRACTICE_CHANCE) {
            picked = pick(known, 2, weight, rng, [newest]);
        } else if (rng() < plainChance(level, mode)) {
            picked = [];
        } else {
            picked = pick(known, randomCount(level, rng, mode), weight, rng, []);
        }
        if (picked.length === 0 || !sameGroups(picked, previous)) return picked;
    }
    return [];
}

function pick(
    pool: readonly ModifierGroupId[],
    count: number,
    weight: (id: ModifierGroupId) => number,
    rng: Rng,
    forced: readonly ModifierGroupId[],
): ModifierGroupId[] {
    const picked = [...forced];
    const candidates = pool.filter((id) => !picked.includes(id));
    while (picked.length < count && candidates.length > 0) {
        const [candidate] = candidates.splice(weightedIndex(candidates.map(weight), rng), 1);
        if (!picked.some((other) => conflicts(candidate, other))) picked.push(candidate);
    }
    return picked;
}

function randomCount(level: number, rng: Rng, mode: Mode): number {
    const max = maxGroupCount(level, mode);
    const late = mode === "hardcore" ? 1 : lateShare(level);
    const early = Array.from(
        { length: max },
        (_, i) => EARLY_COUNT_WEIGHTS[i] ?? EARLY_COUNT_WEIGHTS[2] * 0.5 ** (i - 2),
    );
    const earlySum = early.reduce((sum, weight) => sum + weight, 0);
    const weights = early.map((weight) => ((1 - late) * weight) / earlySum + late / max);
    return weightedIndex(weights, rng) + 1;
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
