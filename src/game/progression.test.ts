import { describe, expect, it } from "vitest";
import { conflicts, groupById, MODIFIER_GROUPS, type ModifierGroupId, TIERS } from "./modifiers.ts";
import {
    createCurriculum,
    type Curriculum,
    EXTRA_GROUP_BONUS_MS,
    FIRST_INTRO_LEVEL,
    INTRO_BONUS_MS,
    INTRO_EVERY,
    introducedAt,
    introLevel,
    isSurgeLevel,
    levelTempo,
    maxGroupCount,
    pickGroups,
    plainChance,
    SURGE_FIRST_LEVEL,
    SURGE_GROUP_COUNT,
    TEMPO_CATCH_UP_LEVELS,
    tempoFor,
    timeLimitFor,
} from "./progression.ts";
import type { Rng } from "./random.ts";

const CURRICULUM: Curriculum = MODIFIER_GROUPS.map((group) => group.id);
const LAST_INTRO = FIRST_INTRO_LEVEL + INTRO_EVERY * (CURRICULUM.length - 1);

// Seeded generator, so the statistical tests below always see the same numbers
function seeded(seed: number): Rng {
    let state = seed;
    return () => {
        state = (state * 1664525 + 1013904223) % 4294967296;
        return state / 4294967296;
    };
}

// Plays one game's levels with the given curriculum
function run(curriculum: Curriculum, rng: Rng, levels = 60): ModifierGroupId[][] {
    const picked: ModifierGroupId[][] = [];
    for (let level = 1; level <= levels; level++) {
        picked.push(pickGroups(level, curriculum, picked.at(-1) ?? [], rng));
    }
    return picked;
}

describe("curriculum", () => {
    it("introduces every group once, easy before medium before hard", () => {
        const rng = seeded(1);
        for (let game = 0; game < 50; game++) {
            const curriculum = createCurriculum(rng);
            const tiers = curriculum.map((id) => TIERS.indexOf(groupById(id).tier));

            expect([...curriculum].sort()).toEqual([...CURRICULUM].sort());
            expect(tiers).toEqual([...tiers].sort((a, b) => a - b));
        }
    });

    it("varies the order between games", () => {
        const rng = seeded(2);
        const orders = new Set(Array.from({ length: 20 }, () => createCurriculum(rng).join()));

        expect(orders.size).toBeGreaterThan(1);
    });

    it("introduces a new group every few levels from level 5", () => {
        expect(introLevel(CURRICULUM, CURRICULUM[0])).toBe(FIRST_INTRO_LEVEL);
        expect(introducedAt(CURRICULUM, FIRST_INTRO_LEVEL)).toBe(CURRICULUM[0]);
        expect(introducedAt(CURRICULUM, FIRST_INTRO_LEVEL + 1)).toBeNull();
        expect(introducedAt(CURRICULUM, FIRST_INTRO_LEVEL + INTRO_EVERY)).toBe(CURRICULUM[1]);
        expect(introducedAt(CURRICULUM, LAST_INTRO)).toBe(CURRICULUM.at(-1));
        expect(introducedAt(CURRICULUM, LAST_INTRO + INTRO_EVERY)).toBeNull();
        expect(introducedAt(CURRICULUM, 2)).toBeNull();
    });
});

describe("pickGroups", () => {
    it("starts without modifiers and brings each group alone first", () => {
        const rng = seeded(3);
        for (let game = 0; game < 200; game++) {
            const curriculum = createCurriculum(rng);
            const levels = run(curriculum, rng);

            levels.slice(0, FIRST_INTRO_LEVEL - 1).forEach((groups) => expect(groups).toEqual([]));
            for (const id of curriculum) {
                const first = levels.findIndex((groups) => groups.includes(id)) + 1;
                expect(first).toBe(introLevel(curriculum, id));
                expect(levels[first - 1]).toEqual([id]);
            }
        }
    });

    it("keeps to the maximum count, one rule group and no conflicts", () => {
        const rng = seeded(4);
        for (let game = 0; game < 200; game++) {
            run(createCurriculum(rng), rng, 80).forEach((groups, index) => {
                const level = index + 1;
                expect(groups.length).toBeLessThanOrEqual(
                    isSurgeLevel(level) ? SURGE_GROUP_COUNT : maxGroupCount(level),
                );
                expect(groups.filter((id) => groupById(id).rule).length).toBeLessThanOrEqual(1);
                for (const a of groups) {
                    for (const b of groups) {
                        if (a !== b) expect(conflicts(a, b)).toBe(false);
                    }
                }
            });
        }
    });

    it("never repeats the groups of the level before", () => {
        const rng = seeded(5);
        for (let game = 0; game < 200; game++) {
            const levels = run(createCurriculum(rng), rng);
            levels.slice(1).forEach((groups, index) => {
                if (groups.length > 0) expect([...groups].sort()).not.toEqual([...levels[index]].sort());
            });
        }
    });

    it("mostly brings the new group back with a known one, once levels hold two groups", () => {
        const rng = seeded(6);
        let practiced = 0;
        const games = 400;
        for (let game = 0; game < games; game++) {
            const curriculum = createCurriculum(rng);
            // Introduced on level 14, so level 15 is the first practice level that may hold two groups
            const newest = curriculum[3];
            const groups = pickGroups(introLevel(curriculum, newest) + 1, curriculum, [newest], rng);
            if (groups.includes(newest) && groups.length === 2) practiced++;
        }

        expect(practiced / games).toBeGreaterThan(0.6);
    });

    it("mixes in more groups and fewer plain levels later on", () => {
        const rng = seeded(7);
        const early = { groups: 0, plain: 0, levels: 0 };
        const late = { groups: 0, plain: 0, levels: 0 };
        for (let game = 0; game < 300; game++) {
            run(createCurriculum(rng), rng).forEach((groups, index) => {
                const level = index + 1;
                const band = level >= 8 && level <= 14 ? early : level > LAST_INTRO ? late : null;
                if (!band) return;
                band.levels++;
                band.groups += groups.length;
                if (groups.length === 0) band.plain++;
            });
        }

        expect(late.groups / late.levels).toBeGreaterThan(early.groups / early.levels);
        expect(late.plain / late.levels).toBeLessThan(early.plain / early.levels);
    });

    it("keeps getting harder after the last introduction, without plain levels from level 80", () => {
        const rng = seeded(8);
        const after = { groups: 0, plain: 0, levels: 0 };
        const later = { groups: 0, plain: 0, levels: 0 };
        for (let game = 0; game < 300; game++) {
            run(createCurriculum(rng), rng, 79).forEach((groups, index) => {
                const level = index + 1;
                const band = level >= 41 && level <= 49 ? after : level >= 71 && level <= 79 ? later : null;
                if (!band || isSurgeLevel(level)) return;
                band.levels++;
                band.groups += groups.length;
                if (groups.length === 0) band.plain++;
            });
        }

        expect(later.groups / later.levels).toBeGreaterThan(after.groups / after.levels);
        expect(later.plain / later.levels).toBeLessThan(after.plain / after.levels);
        expect(plainChance(80)).toBe(0);
        expect(plainChance(120)).toBe(0);
    });

    it("stacks four groups on a surge, every 10 levels from level 50", () => {
        expect([40, 49, 50, 51, 55, 60, 70, 100].map(isSurgeLevel)).toEqual([
            false,
            false,
            true,
            false,
            false,
            true,
            true,
            true,
        ]);

        const rng = seeded(9);
        for (let game = 0; game < 300; game++) {
            const curriculum = createCurriculum(rng);
            for (const level of [SURGE_FIRST_LEVEL, 60, 90]) {
                expect(pickGroups(level, curriculum, [], rng)).toHaveLength(SURGE_GROUP_COUNT);
            }
        }
    });
});

describe("timeLimitFor", () => {
    it("starts at 3 s and gets shorter every level, flattening out, down to 1 s in the late game", () => {
        expect(timeLimitFor(1, 0, false)).toBe(3000);
        expect(timeLimitFor(10, 0, false)).toBeLessThan(timeLimitFor(9, 0, false));
        expect(timeLimitFor(30, 0, false)).toBe(1419);
        for (let level = 1; level < 150; level++) {
            expect(timeLimitFor(level + 1, 0, false)).toBeLessThanOrEqual(timeLimitFor(level, 0, false));
        }
        expect(timeLimitFor(80, 0, false)).toBe(1006);
        expect(timeLimitFor(200, 0, false)).toBe(1000);
    });

    it("gives a surge no extra time for its groups", () => {
        expect(timeLimitFor(SURGE_FIRST_LEVEL, SURGE_GROUP_COUNT, false)).toBe(
            timeLimitFor(SURGE_FIRST_LEVEL, 0, false),
        );
    });

    it("gives extra time for an introduction and for every additional group", () => {
        const base = timeLimitFor(20, 1, false);

        expect(timeLimitFor(20, 1, true)).toBe(base + INTRO_BONUS_MS);
        expect(timeLimitFor(20, 3, false)).toBe(base + 2 * EXTRA_GROUP_BONUS_MS);
        expect(timeLimitFor(20, 0, false)).toBe(base);
    });
});

describe("tempo", () => {
    it("speeds up with the level as much as the time limit shrinks, up to about 2.5 times as fast", () => {
        expect(levelTempo(FIRST_INTRO_LEVEL)).toBe(1);
        expect(levelTempo(40)).toBeCloseTo(timeLimitFor(FIRST_INTRO_LEVEL, 0, false) / timeLimitFor(40, 0, false), 2);
        for (let level = FIRST_INTRO_LEVEL; level < 150; level++) {
            expect(levelTempo(level + 1)).toBeGreaterThanOrEqual(levelTempo(level));
            expect(levelTempo(level)).toBeLessThan(2.6);
        }
    });

    it("starts every modifier at normal speed", () => {
        for (const intro of [5, 17, 38]) {
            expect(tempoFor(intro, intro)).toBe(1);
        }
    });

    it("lets a late modifier catch up with the level faster than an early one", () => {
        expect(tempoFor(39, 35)).toBeGreaterThan(tempoFor(9, 5));
        expect(tempoFor(35 + TEMPO_CATCH_UP_LEVELS, 35)).toBe(levelTempo(35 + TEMPO_CATCH_UP_LEVELS));
    });

    it("never runs ahead of the level", () => {
        for (let intro = 5; intro <= 38; intro += 3) {
            for (let level = intro; level < 80; level++) {
                expect(tempoFor(level, intro)).toBeLessThanOrEqual(levelTempo(level));
                expect(tempoFor(level, intro)).toBeGreaterThanOrEqual(1);
            }
        }
    });
});
