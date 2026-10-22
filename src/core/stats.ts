import { type Award, type AwardId, AWARDS, MODIFIER_CLEARS_NEEDED } from "./awards.ts";
import type { ModifierId } from "./modifiers.ts";
import { field } from "./parse.ts";
import { isSurgeLevel } from "./progression.ts";

export interface Stats {
    readonly games: number;
    // Sum of the levels the games ended on, for the average
    readonly levelSum: number;
    readonly reactionSum: number;
    readonly reactionCount: number;
    readonly playMs: number;
    // Cleared levels per modifier award, over all games
    readonly clears: Readonly<Partial<Record<AwardId, number>>>;
    readonly awards: readonly AwardId[];
}

export const EMPTY_STATS: Stats = {
    games: 0,
    levelSum: 0,
    reactionSum: 0,
    reactionCount: 0,
    playMs: 0,
    clears: {},
    awards: [],
};

export interface LevelClear {
    readonly level: number;
    readonly modifiers: ReadonlySet<ModifierId>;
    // From showing the level to the correct answer; null when the level needs no answer (Don't Click, Spam)
    readonly reactionMs: number | null;
}

export interface ClearResult {
    readonly stats: Stats;
    // Awards unlocked by this clear, in list order
    readonly unlocked: readonly AwardId[];
}

function unlock(stats: Stats, earned: (award: Award) => boolean): ClearResult {
    const unlocked = AWARDS.filter((award) => !stats.awards.includes(award.id) && earned(award)).map(
        (award) => award.id,
    );
    return { stats: unlocked.length > 0 ? { ...stats, awards: [...stats.awards, ...unlocked] } : stats, unlocked };
}

export function clearLevel(stats: Stats, clear: LevelClear): ClearResult {
    const clears = { ...stats.clears };
    for (const award of AWARDS) {
        if (counts(award, clear)) clears[award.id] = (clears[award.id] ?? 0) + 1;
    }
    const next: Stats = {
        ...stats,
        reactionSum: stats.reactionSum + (clear.reactionMs ?? 0),
        reactionCount: stats.reactionCount + (clear.reactionMs === null ? 0 : 1),
        clears,
    };
    return unlock(next, (award) =>
        award.kind === "milestone" ? clear.level >= award.level : (clears[award.id] ?? 0) >= MODIFIER_CLEARS_NEEDED,
    );
}

function counts(award: Award, clear: LevelClear): boolean {
    switch (award.kind) {
        case "milestone":
            return false;
        case "surge":
            return isSurgeLevel(clear.level);
        default:
            return award.modifiers.some((id) => clear.modifiers.has(id));
    }
}

export function finishGame(stats: Stats, level: number, playMs: number): Stats {
    return {
        ...stats,
        games: stats.games + 1,
        levelSum: stats.levelSum + level,
        playMs: stats.playMs + Math.max(0, playMs),
    };
}

export function awardProgress(award: Award, stats: Stats, highscore: number): { have: number; need: number } {
    return award.kind === "milestone"
        ? { have: Math.min(highscore, award.level), need: award.level }
        : { have: Math.min(stats.clears[award.id] ?? 0, MODIFIER_CLEARS_NEEDED), need: MODIFIER_CLEARS_NEEDED };
}

export function averageLevel(stats: Stats): number | null {
    return stats.games > 0 ? Math.round(stats.levelSum / stats.games) : null;
}

export function averageReactionMs(stats: Stats): number | null {
    return stats.reactionCount > 0 ? Math.round(stats.reactionSum / stats.reactionCount) : null;
}

export function formatPlayTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return hours > 0 ? `${hours}H ${minutes}M` : `${minutes}M ${totalSeconds % 60}S`;
}

function count(value: unknown): number {
    return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

const AWARD_IDS: ReadonlySet<string> = new Set(AWARDS.map((award) => award.id));

function isAwardId(value: unknown): value is AwardId {
    return typeof value === "string" && AWARD_IDS.has(value);
}

// Every invalid field falls back on its own, unknown awards are dropped
export function parseStats(stored: unknown): Stats {
    const storedClears = field(stored, "clears");
    const clears: Partial<Record<AwardId, number>> = {};
    for (const award of AWARDS) {
        const value = count(field(storedClears, award.id));
        if (award.kind !== "milestone" && value > 0) clears[award.id] = value;
    }
    const storedAwards = field(stored, "awards");
    return {
        games: count(field(stored, "games")),
        levelSum: count(field(stored, "levelSum")),
        reactionSum: count(field(stored, "reactionSum")),
        reactionCount: count(field(stored, "reactionCount")),
        playMs: count(field(stored, "playMs")),
        clears,
        awards: Array.isArray(storedAwards) ? [...new Set(storedAwards.filter(isAwardId))] : [],
    };
}
