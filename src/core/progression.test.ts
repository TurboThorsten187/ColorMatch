import { describe, expect, it } from "vitest";
import {
    EXTRA_TIME_MS,
    FIRST_INTRO_LEVEL,
    INTRO_BONUS_MS,
    INTRO_EVERY,
    SURGE_FIRST_LEVEL,
    SURGE_TIME_MS,
    TEMPO_CATCH_UP_LEVELS,
} from "./balance.ts";
import { conflicts, groupById, MODIFIER_GROUPS, type ModifierGroupId, TIERS } from "./modifiers.ts";
import {
    createCurriculum,
    type Curriculum,
    DUO_EXTRA_MS,
    introducedAt,
    introLevel,
    isSurgeLevel,
    levelTempo,
    maxGroupCount,
    pickGroups,
    plainChance,
    strengthFor,
    surgeGroupCount,
    tempoFor,
    timeLimitFor,
    ZOOM_MIN_SIZE,
    zoomSizeFor,
} from "./progression.ts";
import type { Rng } from "./random.ts";

const CURRICULUM: Curriculum = MODIFIER_GROUPS.map((group) => group.id);
const LAST_INTRO = FIRST_INTRO_LEVEL + INTRO_EVERY * (CURRICULUM.length - 1);
// Plays past the last introduction
const FULL_RUN = LAST_INTRO + 15;

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

    it("leaves out the groups that hide the shapes in colorblind games", () => {
        const rng = seeded(2);
        const shown = CURRICULUM.filter((id) => !groupById(id).hidesShapes);
        for (let game = 0; game < 20; game++) {
            const curriculum = createCurriculum(rng, true);
            const tiers = curriculum.map((id) => TIERS.indexOf(groupById(id).tier));

            expect([...curriculum].sort()).toEqual([...shown].sort());
            expect(tiers).toEqual([...tiers].sort((a, b) => a - b));
        }
        expect(CURRICULUM.filter((id) => groupById(id).hidesShapes).sort()).toEqual([
            "blur",
            "moving",
            "shaky",
            "zoom",
        ]);
    });

    it("varies the order between games", () => {
        const rng = seeded(2);
        const orders = new Set(Array.from({ length: 20 }, () => createCurriculum(rng).join()));

        expect(orders.size).toBeGreaterThan(1);
    });

    it("moves an introduction due on a surge level to the level after it", () => {
        const index = (SURGE_FIRST_LEVEL - FIRST_INTRO_LEVEL) / INTRO_EVERY;

        expect(introducedAt(CURRICULUM, SURGE_FIRST_LEVEL)).toBeNull();
        expect(introducedAt(CURRICULUM, SURGE_FIRST_LEVEL + 1)).toBe(CURRICULUM[index]);
        expect(introLevel(CURRICULUM, CURRICULUM[index])).toBe(SURGE_FIRST_LEVEL + 1);
        expect(introLevel(CURRICULUM, CURRICULUM[index + 1])).toBe(SURGE_FIRST_LEVEL + INTRO_EVERY);
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
            const levels = run(curriculum, rng, FULL_RUN);

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
                    isSurgeLevel(level) ? surgeGroupCount(level) : maxGroupCount(level),
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
        let games = 0;
        while (games < 400) {
            const curriculum = createCurriculum(rng);
            // Introduced on level 14, so level 15 is the first practice level that may hold two groups
            const newest = curriculum[3];
            games++;
            const groups = pickGroups(introLevel(curriculum, newest) + 1, curriculum, [newest], rng);
            if (groups.includes(newest) && groups.length === 2) practiced++;
        }

        expect(practiced / games).toBeGreaterThan(0.6);
    });

    it("mixes the newer groups with others, in surges too", () => {
        const newer: readonly ModifierGroupId[] = [
            "zoom",
            "splitMirror",
            "countUp",
            "assemble",
            "fontFlip",
            "negative",
            "wait",
            "doubleTap",
            "twoWords",
        ];
        const rng = seeded(10);
        const mixed = new Set<ModifierGroupId>();
        let surgesWithNewer = 0;
        for (let game = 0; game < 200; game++) {
            run(createCurriculum(rng), rng, FULL_RUN).forEach((groups, index) => {
                const shown = groups.filter((id) => newer.includes(id));
                if (groups.length > 1) shown.forEach((id) => mixed.add(id));
                if (isSurgeLevel(index + 1) && shown.length > 0) surgesWithNewer++;
            });
        }

        expect([...mixed].sort()).toEqual([...newer].sort());
        expect(surgesWithNewer).toBeGreaterThan(0);
    });

    it("mixes in more groups and fewer plain levels later on", () => {
        const rng = seeded(7);
        const early = { groups: 0, plain: 0, levels: 0 };
        const late = { groups: 0, plain: 0, levels: 0 };
        for (let game = 0; game < 300; game++) {
            run(createCurriculum(rng), rng, FULL_RUN).forEach((groups, index) => {
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

    it("stacks five groups on the first surge and one more on each after it, every 10 levels from level 50", () => {
        expect([40, 49, 50, 51, 55, 60, 70, 100].map((level) => isSurgeLevel(level))).toEqual([
            false,
            false,
            true,
            false,
            false,
            true,
            true,
            true,
        ]);

        expect([SURGE_FIRST_LEVEL, 60, 90, 150].map((level) => surgeGroupCount(level))).toEqual([5, 6, 9, 15]);

        const rng = seeded(9);
        for (let game = 0; game < 300; game++) {
            const curriculum = createCurriculum(rng);
            for (const level of [SURGE_FIRST_LEVEL, 60, 90]) {
                expect(pickGroups(level, curriculum, [], rng)).toHaveLength(surgeGroupCount(level));
            }
        }
    });

    it("stacks as many groups as go together once a surge asks for more", () => {
        const rng = seeded(10);
        for (let game = 0; game < 300; game++) {
            const groups = pickGroups(200, CURRICULUM, [], rng);
            expect(groups.length).toBeLessThan(surgeGroupCount(200));
            for (const id of CURRICULUM.filter((other) => !groups.includes(other))) {
                expect(groups.some((other) => conflicts(id, other))).toBe(true);
            }
        }
    });

    it("lets one more group share a level every 12 levels, starting with one", () => {
        expect([1, 12, 13, 24, 25, 37, 49, 100].map((level) => maxGroupCount(level))).toEqual([1, 1, 2, 2, 3, 4, 5, 9]);
    });

    it("brings every count up to the maximum about equally often from level 80 on", () => {
        const rng = seeded(11);
        const picks = 3000;
        const counts = new Map<number, number>();
        for (let i = 0; i < picks; i++) {
            const count = pickGroups(101, CURRICULUM, [], rng).length;
            counts.set(count, (counts.get(count) ?? 0) + 1);
        }

        expect([...counts.keys()].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const times of counts.values()) {
            expect(times / picks).toBeGreaterThan(0.08);
            expect(times / picks).toBeLessThan(0.15);
        }
    });
});

describe("timeLimitFor", () => {
    it("starts at 3 s and gets shorter every level, flattening out, down to 1 s at level 80", () => {
        expect(timeLimitFor(1, [], false)).toBe(3000);
        expect(timeLimitFor(10, [], false)).toBeLessThan(timeLimitFor(9, [], false));
        expect(timeLimitFor(30, [], false)).toBe(2007);
        expect(timeLimitFor(1, [], false) - timeLimitFor(10, [], false)).toBeGreaterThan(
            timeLimitFor(40, [], false) - timeLimitFor(49, [], false),
        );
        // Surge levels have their own fixed time
        const levels = Array.from({ length: 150 }, (_, index) => index + 1).filter((level) => !isSurgeLevel(level));
        for (let index = 1; index < levels.length; index++) {
            expect(timeLimitFor(levels[index], [], false)).toBeLessThanOrEqual(
                timeLimitFor(levels[index - 1], [], false),
            );
        }
        expect(timeLimitFor(79, [], false)).toBeGreaterThan(1000);
        expect(timeLimitFor(81, [], false)).toBe(1000);
        expect(timeLimitFor(201, [], false)).toBe(1000);
    });

    it("gives a surge its fixed time, however many groups it stacks", () => {
        const stacked = (level: number): ModifierGroupId[] => CURRICULUM.slice(0, surgeGroupCount(level));

        expect(timeLimitFor(SURGE_FIRST_LEVEL, stacked(SURGE_FIRST_LEVEL), false)).toBe(SURGE_TIME_MS);
        expect(timeLimitFor(120, stacked(120), false)).toBe(SURGE_TIME_MS);
    });

    it("gives extra time for an introduction and for every group by its tier, the first one too", () => {
        const base = timeLimitFor(20, [], false);

        expect(EXTRA_TIME_MS).toEqual({ easy: 200, medium: 300, hard: 400 });
        expect(timeLimitFor(20, ["rotation"], false)).toBe(base + EXTRA_TIME_MS.easy);
        expect(timeLimitFor(20, ["rotation"], true)).toBe(base + INTRO_BONUS_MS + EXTRA_TIME_MS.easy);
        expect(timeLimitFor(20, ["rotation", "blur", "scrambled"], false)).toBe(
            base + EXTRA_TIME_MS.easy + EXTRA_TIME_MS.medium + EXTRA_TIME_MS.hard,
        );
    });

    it("gives DUO 1.5 s on top of its extra time, on a surge and in hardcore too", () => {
        const base = timeLimitFor(20, [], false);

        expect(DUO_EXTRA_MS).toBe(1500);
        expect(timeLimitFor(20, ["twoWords"], false)).toBe(base + EXTRA_TIME_MS.hard + DUO_EXTRA_MS);
        expect(timeLimitFor(SURGE_FIRST_LEVEL, ["rotation", "twoWords"], false)).toBe(SURGE_TIME_MS + DUO_EXTRA_MS);
        expect(timeLimitFor(2, ["twoWords"], false, "hardcore")).toBe(1000 + EXTRA_TIME_MS.hard + DUO_EXTRA_MS);
    });
});

describe("strength", () => {
    it("grows along with the tempo, from 0 on the intro level to 1 from level 80 on", () => {
        expect(strengthFor(20, 20)).toBe(0);
        expect(strengthFor(FIRST_INTRO_LEVEL, FIRST_INTRO_LEVEL)).toBe(0);
        expect(strengthFor(80, FIRST_INTRO_LEVEL)).toBe(1);
        expect(strengthFor(200, 60)).toBe(1);
        const middle = strengthFor(40, FIRST_INTRO_LEVEL);
        expect(middle).toBeGreaterThan(0.25);
        expect(middle).toBeLessThan(0.5);
        for (let level = 30; level < 120; level++) {
            expect(strengthFor(level + 1, 30)).toBeGreaterThanOrEqual(strengthFor(level, 30));
        }
    });
});

describe("tempo", () => {
    it("speeds up along with the shrinking time limit, up to 1.5 times as fast from level 80 on", () => {
        expect(levelTempo(FIRST_INTRO_LEVEL)).toBe(1);
        expect(levelTempo(40)).toBeGreaterThan(1.15);
        expect(levelTempo(40)).toBeLessThan(1.2);
        expect(levelTempo(80)).toBeCloseTo(1.5);
        expect(levelTempo(150)).toBeCloseTo(1.5);
        for (let level = FIRST_INTRO_LEVEL; level < 150; level++) {
            expect(levelTempo(level + 1)).toBeGreaterThanOrEqual(levelTempo(level));
            expect(levelTempo(level)).toBeLessThanOrEqual(1.5 + 1e-9);
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

describe("hardcore", () => {
    it("introduces nothing and may bring any group from level 1, never a plain level", () => {
        const rng = seeded(12);
        const seen = new Set<ModifierGroupId>();
        for (let game = 0; game < 300; game++) {
            const curriculum = createCurriculum(rng);
            expect(introducedAt(curriculum, FIRST_INTRO_LEVEL, "hardcore")).toBeNull();
            for (let level = 1; level <= 9; level++) {
                const groups = pickGroups(level, curriculum, [], rng, "hardcore");
                expect(groups.length).toBeGreaterThanOrEqual(1);
                expect(groups.length).toBeLessThanOrEqual(maxGroupCount(level, "hardcore"));
                groups.forEach((id) => seen.add(id));
            }
        }

        expect(seen.size).toBe(MODIFIER_GROUPS.length);
        expect(plainChance(1, "hardcore")).toBe(0);
    });

    it("lets one more group share a level every 3 levels", () => {
        expect([1, 3, 4, 7, 28].map((level) => maxGroupCount(level, "hardcore"))).toEqual([1, 1, 2, 3, 10]);
    });

    it("surges from level 10 every 5 levels, five groups first and one more on each after it", () => {
        expect([5, 9, 10, 12, 15, 20, 50].map((level) => isSurgeLevel(level, "hardcore"))).toEqual([
            false,
            false,
            true,
            false,
            true,
            true,
            true,
        ]);
        expect([10, 15, 20, 30].map((level) => surgeGroupCount(level, "hardcore"))).toEqual([5, 6, 7, 9]);
        expect(pickGroups(10, CURRICULUM, [], seeded(13), "hardcore")).toHaveLength(5);
    });

    it("gives 1 s plus the extra time of the groups, with tempo, strength and zoom at their full from level 1", () => {
        expect(timeLimitFor(1, [], false, "hardcore")).toBe(1000);
        expect(timeLimitFor(2, ["rotation", "scrambled"], false, "hardcore")).toBe(
            1000 + EXTRA_TIME_MS.easy + EXTRA_TIME_MS.hard,
        );
        expect(timeLimitFor(10, ["rotation"], false, "hardcore")).toBe(SURGE_TIME_MS);
        expect(tempoFor(1, 50, "hardcore")).toBe(1.5);
        expect(strengthFor(1, 50, "hardcore")).toBe(1);
        expect(zoomSizeFor(1, 50, "hardcore")).toBe(ZOOM_MIN_SIZE);
    });
});
