import type { Tier } from "./modifiers.ts";

// The numbers that tune the difficulty of a game, in one place. Numbers that belong to a single modifier stay with it.

// INTRODUCTIONS: from FIRST_INTRO_LEVEL every INTRO_EVERY levels one new modifier group, alone on its level
export const FIRST_INTRO_LEVEL = 5;
export const INTRO_EVERY = 3;
// The introduction level gets this much extra time
export const INTRO_BONUS_MS = 1000;
// The level right after an introduction brings the new group back this often, together with a known one. Alone it
// would repeat the introduction level, which no level may do, so there is no practice while levels hold one group.
export const PRACTICE_CHANCE = 0.7;
// Freshly introduced groups are picked more often; the advantage fades over about ten levels
export const FRESH_BOOST = 2;
export const FRESH_FADE_LEVELS = 6;

// TIME per level: 3 s at level 1, down to 1 s at LATE_UNTIL_LEVEL along a gentle bend that flattens out towards the
// end
export const BASE_MIN_MS = 1000;
export const BASE_RANGE_MS = 2000;
export const BASE_BEND = 1.5;
// Every group of a level brings extra time, the harder its tier the more
export const EXTRA_TIME_MS: Readonly<Record<Tier, number>> = { easy: 200, medium: 300, hard: 400 };

// GROUPS PER LEVEL: every COUNT_GROWS_EVERY levels one more group may share a level, starting with one
export const COUNT_GROWS_EVERY = 12;
// How likely 1, 2, 3 or more groups are early on, cut off at the level's maximum; above three each count is half as
// likely as the one before
export const EARLY_COUNT_WEIGHTS: readonly number[] = [0.6, 0.3, 0.1];

// LATE GAME: from LATE_FROM_LEVEL the levels get harder until LATE_UNTIL_LEVEL: plain levels die out and every count
// up to the maximum becomes as likely as any other
export const LATE_FROM_LEVEL = 40;
export const LATE_UNTIL_LEVEL = 80;

// SURGES: every few levels a surge stacks more groups than any other level, announced by a banner: five on the first,
// one more on each after it, as many as go together. It always lasts the same time, however many groups it stacks.
export const SURGE_FIRST_LEVEL = 50;
export const SURGE_EVERY = 10;
export const SURGE_FIRST_GROUP_COUNT = 5;
export const SURGE_TIME_MS = 1300;
export const SURGE_BANNER_MS = 900;

// TEMPO AND STRENGTH: animated modifiers speed up along with the shrinking time limit, MAX_TEMPO times as fast once the
// time limit is at its minimum. Each one reaches the level's tempo within TEMPO_CATCH_UP_LEVELS after its introduction.
export const MAX_TEMPO = 1.5;
export const TEMPO_CATCH_UP_LEVELS = 8;

// HARDCORE introduces nothing: every group may come from level 1, with the time at its minimum, tempo, strength and
// zoom at their full and the count mixed as in the late game. One more group may share a level every few levels, and
// surges come earlier and more often. It opens once a normal game has cleared HARDCORE_UNLOCK_SCORE levels.
export const HARDCORE_UNLOCK_SCORE = 50;
export const HARDCORE_COUNT_GROWS_EVERY = 3;
export const HARDCORE_SURGE_FIRST_LEVEL = 10;
export const HARDCORE_SURGE_EVERY = 5;

// AWARDS: levels with a modifier, or surge levels, that have to be cleared, summed up over all games
export const MODIFIER_CLEARS_NEEDED = 10;

// GAME OVER: frantic presses right after losing must not skip the result: RETRY, MENU and Enter wait this long, through
// the loss animation until the buttons have appeared
export const GAME_OVER_LOCK_MS = 2000;
