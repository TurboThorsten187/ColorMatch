import { type Answer, type Challenge, createChallenge } from "./challenge.ts";
import { groupsOf, type ModifierGroupId } from "./modifiers.ts";
import { createCurriculum, type Curriculum, introducedAt, pickGroups, timeLimitFor } from "./progression.ts";
import type { Rng } from "./random.ts";

export const SPAM_PRESSES_NEEDED = 5;
// Shown instead of a color word, one character lights up per press
export const SPAM_WORD = "SPAM!";
export const SPAM_PAUSE_MS = 1000;
// Frantic presses right after losing must not skip the result: RETRY, MENU and Enter wait this long, through the
// loss animation until the buttons have appeared
export const GAME_OVER_LOCK_MS = 2000;

export type PlayingState = {
    readonly phase: "playing";
    readonly level: number;
    readonly challenge: Challenge;
    readonly startedAt: number;
    readonly timeLimit: number;
    readonly spamCount: number;
    readonly curriculum: Curriculum;
};

export type SpamPauseState = {
    readonly phase: "spamPause";
    readonly level: number;
    readonly resumeAt: number;
    readonly curriculum: Curriculum;
    // The groups of the SPAM! level, the next level must not repeat them
    readonly groups: readonly ModifierGroupId[];
};

export type GameOverState = { readonly phase: "gameOver"; readonly score: number; readonly endedAt: number };

export type GameState =
    | { readonly phase: "menu" }
    | PlayingState
    | SpamPauseState
    | { readonly phase: "paused"; readonly resumeTo: PlayingState | SpamPauseState; readonly pausedAt: number }
    | GameOverState;

export const MENU: GameState = { phase: "menu" };

// All transitions below are pure: they take the current time in ms and return a new state,
// or the same state object when nothing changes.

export function startGame(now: number, rng: Rng): GameState {
    return playLevel(1, now, rng, createCurriculum(rng), []);
}

export function answer(state: GameState, input: Answer, now: number, rng: Rng): GameState {
    if (state.phase !== "playing") return state;
    // The press came after the time ran out, only the next frame's tick had not noticed it yet
    if (now - state.startedAt > state.timeLimit) return timeUp(state, now, rng);

    const { expected } = state.challenge;
    if (expected === "none") return gameOver(state.level, now);

    if (expected === "spam") {
        const spamCount = state.spamCount + 1;
        return spamCount >= SPAM_PRESSES_NEEDED
            ? {
                  phase: "spamPause",
                  level: state.level,
                  resumeAt: now + SPAM_PAUSE_MS,
                  curriculum: state.curriculum,
                  groups: groupsOf(state.challenge.modifiers),
              }
            : { ...state, spamCount };
    }

    return input === expected ? nextLevel(state, now, rng) : gameOver(state.level, now);
}

// The "go on" input outside of a running level: start, continue, or retry after game over
export function confirm(state: GameState, now: number, rng: Rng): GameState {
    switch (state.phase) {
        case "menu":
            return startGame(now, rng);
        case "paused":
            return resume(state, now);
        case "gameOver":
            return isGameOverLocked(state, now) ? state : startGame(now, rng);
        default:
            return state;
    }
}

export function toMenu(state: GameState, now: number): GameState {
    return state.phase === "gameOver" && !isGameOverLocked(state, now) ? MENU : state;
}

export function isGameOverLocked(state: GameOverState, now: number): boolean {
    return now - state.endedAt < GAME_OVER_LOCK_MS;
}

export function tick(state: GameState, now: number, rng: Rng): GameState {
    switch (state.phase) {
        case "playing":
            return now - state.startedAt <= state.timeLimit ? state : timeUp(state, now, rng);
        case "spamPause":
            return now >= state.resumeAt ? playLevel(state.level + 1, now, rng, state.curriculum, state.groups) : state;
        default:
            return state;
    }
}

// Waiting out a DON'T CLICK level solves it, every other level is lost
function timeUp(state: PlayingState, now: number, rng: Rng): GameState {
    return state.challenge.expected === "none" ? nextLevel(state, now, rng) : gameOver(state.level, now);
}

export function pause(state: GameState, now: number): GameState {
    if (state.phase !== "playing" && state.phase !== "spamPause") return state;
    return { phase: "paused", resumeTo: state, pausedAt: now };
}

// Continues where the game was paused: the time spent paused does not count
export function resume(state: GameState, now: number): GameState {
    if (state.phase !== "paused") return state;

    const pausedFor = now - state.pausedAt;
    const previous = state.resumeTo;
    return previous.phase === "playing"
        ? { ...previous, startedAt: previous.startedAt + pausedFor }
        : { ...previous, resumeAt: previous.resumeAt + pausedFor };
}

function nextLevel(state: PlayingState, now: number, rng: Rng): PlayingState {
    return playLevel(state.level + 1, now, rng, state.curriculum, groupsOf(state.challenge.modifiers));
}

function playLevel(
    level: number,
    now: number,
    rng: Rng,
    curriculum: Curriculum,
    previous: readonly ModifierGroupId[],
): PlayingState {
    const groups = pickGroups(level, curriculum, previous, rng);
    return {
        phase: "playing",
        level,
        challenge: createChallenge(groups, level, rng),
        startedAt: now,
        timeLimit: timeLimitFor(level, groups.length, introducedAt(curriculum, level) !== null),
        spamCount: 0,
        curriculum,
    };
}

// The score is the number of solved levels
function gameOver(level: number, now: number): GameState {
    return { phase: "gameOver", score: level - 1, endedAt: now };
}
