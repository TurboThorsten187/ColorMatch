import { type Answer, type Challenge, createChallenge } from "./challenge.ts";
import type { Rng } from "./random.ts";

export const SPAM_PRESSES_NEEDED = 5;
export const SPAM_PAUSE_MS = 1000;

const START_TIME_MS = 3000;
const MIN_TIME_MS = 1500;
const TIME_STEP_MS = 50;

export type GameState =
    | { readonly phase: "menu" }
    | {
          readonly phase: "playing";
          readonly level: number;
          readonly challenge: Challenge;
          readonly startedAt: number;
          readonly timeLimit: number;
          readonly spamCount: number;
      }
    | { readonly phase: "spamPause"; readonly level: number; readonly resumeAt: number }
    | { readonly phase: "gameOver"; readonly score: number };

export type PlayingState = Extract<GameState, { phase: "playing" }>;

export const MENU: GameState = { phase: "menu" };

// All transitions below are pure: they take the current time in ms and return a new state,
// or the same state object when nothing changes.

export function timeLimitFor(level: number): number {
    return level === 1 ? START_TIME_MS : Math.max(MIN_TIME_MS, START_TIME_MS - level * TIME_STEP_MS);
}

export function startGame(now: number, rng: Rng): GameState {
    return playLevel(1, now, rng);
}

export function answer(state: GameState, input: Answer, now: number, rng: Rng): GameState {
    if (state.phase !== "playing") return state;

    const { expected } = state.challenge;
    if (expected === "none") return gameOver(state.level);

    if (expected === "spam") {
        const spamCount = state.spamCount + 1;
        return spamCount >= SPAM_PRESSES_NEEDED
            ? { phase: "spamPause", level: state.level, resumeAt: now + SPAM_PAUSE_MS }
            : { ...state, spamCount };
    }

    return input === expected ? playLevel(state.level + 1, now, rng) : gameOver(state.level);
}

export function tick(state: GameState, now: number, rng: Rng): GameState {
    switch (state.phase) {
        case "playing":
            if (now - state.startedAt <= state.timeLimit) return state;
            return state.challenge.expected === "none" ? playLevel(state.level + 1, now, rng) : gameOver(state.level);
        case "spamPause":
            return now >= state.resumeAt ? playLevel(state.level + 1, now, rng) : state;
        default:
            return state;
    }
}

function playLevel(level: number, now: number, rng: Rng): PlayingState {
    return {
        phase: "playing",
        level,
        challenge: createChallenge(level, rng),
        startedAt: now,
        timeLimit: timeLimitFor(level),
        spamCount: 0,
    };
}

// The score is the number of solved levels
function gameOver(level: number): GameState {
    return { phase: "gameOver", score: level - 1 };
}
