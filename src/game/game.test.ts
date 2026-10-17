import { describe, expect, it } from "vitest";
import type { ExpectedInput } from "./challenge.ts";
import {
    answer,
    type GameState,
    MENU,
    type PlayingState,
    SPAM_PAUSE_MS,
    SPAM_PRESSES_NEEDED,
    startGame,
    tick,
    timeLimitFor,
} from "./game.ts";

const rng = Math.random;

function playing(expected: ExpectedInput, level = 1): PlayingState {
    return {
        phase: "playing",
        level,
        challenge: {
            word: "red",
            color: "red",
            modifiers: new Set(),
            expected,
            background: null,
            rotationDeg: 0,
        },
        startedAt: 0,
        timeLimit: timeLimitFor(level),
        spamCount: 0,
    };
}

function levelOf(state: GameState): number | undefined {
    return state.phase === "playing" ? state.level : undefined;
}

describe("game", () => {
    it("starts at level 1 with a fresh timer", () => {
        const state = startGame(1234, rng);

        expect(state).toMatchObject({ phase: "playing", level: 1, startedAt: 1234, timeLimit: 3000, spamCount: 0 });
    });

    it("advances on a correct true or false answer", () => {
        expect(levelOf(answer(playing("true"), "true", 100, rng))).toBe(2);
        expect(levelOf(answer(playing("false"), "false", 100, rng))).toBe(2);
    });

    it("restarts the timer for the next level", () => {
        expect(answer(playing("true"), "true", 500, rng)).toMatchObject({ startedAt: 500, timeLimit: 2900 });
    });

    it("ends the game on a wrong answer with the solved levels as score", () => {
        expect(answer(playing("true", 4), "false", 100, rng)).toEqual({ phase: "gameOver", score: 3 });
    });

    it("ends the game when the time runs out", () => {
        const state = playing("true");

        expect(tick(state, state.timeLimit, rng)).toBe(state);
        expect(tick(state, state.timeLimit + 1, rng)).toEqual({ phase: "gameOver", score: 0 });
    });

    it("advances when nothing is pressed during a no-click challenge", () => {
        const state = playing("none");

        expect(levelOf(tick(state, state.timeLimit + 1, rng))).toBe(2);
    });

    it("ends the game when anything is pressed during a no-click challenge", () => {
        expect(answer(playing("none"), "true", 100, rng).phase).toBe("gameOver");
        expect(answer(playing("none"), "false", 100, rng).phase).toBe("gameOver");
    });

    it("needs repeated presses for a spam challenge and pauses before the next level", () => {
        let state: GameState = playing("spam");
        for (let i = 1; i < SPAM_PRESSES_NEEDED; i++) {
            state = answer(state, i % 2 ? "true" : "false", 100, rng);
            expect(state).toMatchObject({ phase: "playing", level: 1, spamCount: i });
        }

        state = answer(state, "true", 100, rng);
        expect(state).toEqual({ phase: "spamPause", level: 1, resumeAt: 100 + SPAM_PAUSE_MS });

        expect(tick(state, 100 + SPAM_PAUSE_MS - 1, rng)).toBe(state);
        expect(tick(state, 100 + SPAM_PAUSE_MS, rng)).toMatchObject({
            phase: "playing",
            level: 2,
            startedAt: 100 + SPAM_PAUSE_MS,
        });
    });

    it("ends the game when a spam challenge is not finished in time", () => {
        const state = answer(playing("spam"), "true", 100, rng);

        expect(tick(state, timeLimitFor(1) + 1, rng).phase).toBe("gameOver");
    });

    it("ignores answers and time outside of a running level", () => {
        const over: GameState = { phase: "gameOver", score: 2 };

        expect(answer(MENU, "true", 0, rng)).toBe(MENU);
        expect(answer(over, "true", 0, rng)).toBe(over);
        expect(tick(MENU, 1e9, rng)).toBe(MENU);
        expect(tick(over, 1e9, rng)).toBe(over);
    });

    it("shortens the time limit per level down to a minimum", () => {
        expect(timeLimitFor(1)).toBe(3000);
        expect(timeLimitFor(2)).toBe(2900);
        expect(timeLimitFor(10)).toBe(2500);
        expect(timeLimitFor(30)).toBe(1500);
        expect(timeLimitFor(100)).toBe(1500);
    });
});
