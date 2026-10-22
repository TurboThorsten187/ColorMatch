import type { ModifierGroupId } from "@/modifiers/types.ts";
import { GAME_OVER_LOCK_MS, SURGE_BANNER_MS } from "./balance.ts";
import { type Answer, type Challenge, createChallenge } from "./challenge.ts";
import {
    createCurriculum,
    type Curriculum,
    introducedAt,
    introLevel,
    isSurgeLevel,
    type Mode,
    pickGroups,
    strengthFor,
    tempoFor,
    timeLimitFor,
} from "./progression.ts";
import type { Rng } from "./random.ts";

// After the last press of a SPAM! level the whole word stays lit for SPAM_BANG_MS, then STOP SPAMMING! shows for
// SPAM_PAUSE_MS, so further presses go nowhere
export const SPAM_PAUSE_MS = 500;
export const SPAM_BANG_MS = 120;
// From here on the time is running out: the timer turns red and beeps
export const LOW_TIME_SHARE = 0.25;

export type PlayingState = {
    readonly phase: "playing";
    readonly level: number;
    readonly challenge: Challenge;
    readonly startedAt: number;
    readonly timeLimit: number;
    // Presses so far in a SPAM! level, each one lights up a character
    readonly spamCount: number;
    // Right answers so far in a level that needs more than one (DOUBLE TAP)
    readonly taps: number;
    readonly curriculum: Curriculum;
    readonly mode: Mode;
};

export type SpamPauseState = {
    readonly phase: "spamPause";
    readonly level: number;
    readonly resumeAt: number;
    readonly curriculum: Curriculum;
    readonly mode: Mode;
    // The SPAM! level at its last press, shown fully lit for SPAM_BANG_MS; the next level must not repeat its groups
    readonly solved: PlayingState;
    readonly solvedAt: number;
};

// The SURGE banner, the surge level starts when it is gone
export type SurgeBannerState = {
    readonly phase: "surgeBanner";
    readonly level: number;
    readonly resumeAt: number;
    readonly curriculum: Curriculum;
    readonly mode: Mode;
};

// How a level was lost: a wrong press, a press before WAIT turned into NOW, or the time ran out
export type LossReason = "miss" | "early" | "timeout";

// RETRY plays the same mode again
export type GameOverState = {
    readonly phase: "gameOver";
    readonly score: number;
    readonly endedAt: number;
    readonly mode: Mode;
    readonly reason: LossReason;
    // The level that was lost, as it was at that moment
    readonly lost: PlayingState;
};

export type GameState =
    | { readonly phase: "menu" }
    | PlayingState
    | SpamPauseState
    | SurgeBannerState
    | {
          readonly phase: "paused";
          readonly resumeTo: PlayingState | SpamPauseState | SurgeBannerState;
          readonly pausedAt: number;
      }
    | GameOverState;

export const MENU: GameState = { phase: "menu" };

// All transitions below are pure: they take the current time in ms and return a new state,
// or the same state object when nothing changes.

// `colorblind` leaves out the modifier groups that hide the shapes
export function startGame(now: number, rng: Rng, mode: Mode = "normal", colorblind = false): GameState {
    return playLevel(1, now, rng, createCurriculum(rng, colorblind), [], mode);
}

// The mode of the running game; the menu belongs to none
export function modeOf(state: GameState): Mode | null {
    if (state.phase === "menu") return null;
    return state.phase === "paused" ? state.resumeTo.mode : state.mode;
}

export function answer(state: GameState, input: Answer, now: number, rng: Rng): GameState {
    if (state.phase !== "playing") return state;
    // The press came after the time ran out, only the next frame's tick had not noticed it yet
    if (now - state.startedAt > state.timeLimit) return timeUp(state, now, rng);

    const { expected, presses } = state.challenge;
    if (isTooEarly(state, now)) return gameOver(state, now, "early");
    if (expected === "none") return gameOver(state, now, "miss");

    // Presses anywhere count
    if (expected === "spam") {
        const spamCount = state.spamCount + 1;
        return spamCount >= presses
            ? {
                  phase: "spamPause",
                  level: state.level,
                  resumeAt: now + SPAM_BANG_MS + SPAM_PAUSE_MS,
                  curriculum: state.curriculum,
                  mode: state.mode,
                  solved: { ...state, spamCount },
                  solvedAt: now,
              }
            : { ...state, spamCount };
    }

    if (input !== expected) return gameOver(state, now, "miss");
    const taps = state.taps + 1;
    return taps < presses ? { ...state, taps } : nextLevel(state, now, rng);
}

// The SPAM! level is solved and still shows its word, fully lit
export function isSpamBang(state: SpamPauseState, now: number): boolean {
    return state.resumeAt - now > SPAM_PAUSE_MS;
}

// A press while the level's rule still locks it (a WAIT level before WAIT has turned into NOW)
export function isTooEarly(state: PlayingState, now: number): boolean {
    return now - state.startedAt < state.timeLimit * state.challenge.lockedShare;
}

// Share of the level's time that is left at `now`, 1 when it begins and 0 when it runs out
export function remainingShare(state: PlayingState, now: number): number {
    return 1 - (now - state.startedAt) / state.timeLimit;
}

// How long a correct answer at `at` took: from showing the word, or from the end of a locked start (WAIT's NOW). Null
// for levels that ask for no answer (Don't Click, SPAM!)
export function reactionMs(state: PlayingState, at: number): number | null {
    const { expected, lockedShare } = state.challenge;
    if (expected !== "true" && expected !== "false") return null;
    return at - state.startedAt - state.timeLimit * lockedShare;
}

// The "go on" input outside of a running level: start, continue, or retry after game over
export function confirm(state: GameState, now: number, rng: Rng, colorblind = false): GameState {
    switch (state.phase) {
        case "menu":
            return startGame(now, rng, "normal", colorblind);
        case "paused":
            return resume(state, now);
        case "gameOver":
            return isGameOverLocked(state, now) ? state : startGame(now, rng, state.mode, colorblind);
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
            return now >= state.resumeAt
                ? enterLevel(state.level + 1, now, rng, state.curriculum, state.solved.challenge.groups, state.mode)
                : state;
        case "surgeBanner":
            // The surge stacks more groups than any level before, it cannot repeat the one before
            return now >= state.resumeAt ? playLevel(state.level, now, rng, state.curriculum, [], state.mode) : state;
        default:
            return state;
    }
}

// Waiting out a DON'T CLICK level solves it, every other level is lost
function timeUp(state: PlayingState, now: number, rng: Rng): GameState {
    return state.challenge.expected === "none" ? nextLevel(state, now, rng) : gameOver(state, now, "timeout");
}

export function pause(state: GameState, now: number): GameState {
    if (state.phase !== "playing" && state.phase !== "spamPause" && state.phase !== "surgeBanner") return state;
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

function nextLevel(state: PlayingState, now: number, rng: Rng): GameState {
    return enterLevel(state.level + 1, now, rng, state.curriculum, state.challenge.groups, state.mode);
}

// A surge level shows its banner first
function enterLevel(
    level: number,
    now: number,
    rng: Rng,
    curriculum: Curriculum,
    previous: readonly ModifierGroupId[],
    mode: Mode,
): GameState {
    return isSurgeLevel(level, mode)
        ? { phase: "surgeBanner", level, resumeAt: now + SURGE_BANNER_MS, curriculum, mode }
        : playLevel(level, now, rng, curriculum, previous, mode);
}

function playLevel(
    level: number,
    now: number,
    rng: Rng,
    curriculum: Curriculum,
    previous: readonly ModifierGroupId[],
    mode: Mode,
): PlayingState {
    const groups = pickGroups(level, curriculum, previous, rng, mode);
    const introducedOn = (id: ModifierGroupId): number => introLevel(curriculum, id);
    const tempo = Object.fromEntries(groups.map((id) => [id, tempoFor(level, introducedOn(id), mode)]));
    const strength = Object.fromEntries(groups.map((id) => [id, strengthFor(level, introducedOn(id), mode)]));
    const challenge = createChallenge(groups, rng, { level, mode, introducedOn }, tempo, strength);
    return {
        phase: "playing",
        level,
        challenge,
        startedAt: now,
        timeLimit: timeLimitFor(level, groups, introducedAt(curriculum, level, mode) !== null, mode),
        spamCount: 0,
        taps: 0,
        curriculum,
        mode,
    };
}

// The score is the number of solved levels
function gameOver(state: PlayingState, now: number, reason: LossReason): GameState {
    return { phase: "gameOver", score: state.level - 1, endedAt: now, mode: state.mode, reason, lost: state };
}
