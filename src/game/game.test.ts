import { describe, expect, it } from "vitest";
import type { ExpectedInput } from "./challenge.ts";
import {
    answer,
    confirm,
    DOUBLE_TAPS,
    GAME_OVER_LOCK_MS,
    type GameState,
    isSpamBang,
    MENU,
    pause,
    type PlayingState,
    resume,
    SPAM_BANG_MS,
    SPAM_PAUSE_MS,
    SPAM_PRESSES_NEEDED,
    SPAM_WORD,
    startGame,
    SURGE_BANNER_MS,
    type SurgeBannerState,
    tick,
    toMenu,
    WAIT_SHARE,
} from "./game.ts";
import { groupsOf, MODIFIER_GROUPS, type ModifierId } from "./modifiers.ts";
import {
    introLevel,
    NO_CLICK_TIME_SHARE,
    SURGE_FIRST_LEVEL,
    SURGE_TIME_MS,
    surgeGroupCount,
    tempoFor,
    timeLimitFor,
    ZOOM_SIZE,
} from "./progression.ts";

const rng = Math.random;
const CURRICULUM = MODIFIER_GROUPS.map((group) => group.id);

function playing(
    expected: ExpectedInput,
    level = 1,
    modifiers: readonly ModifierId[] = expected === "spam" ? ["spam"] : [],
): PlayingState {
    return {
        phase: "playing",
        level,
        challenge: {
            word: "red",
            color: "red",
            modifiers: new Set(modifiers),
            expected,
            background: null,
            rotationDeg: 0,
            seed: 0,
            tempo: {},
            second: null,
            size: 1,
        },
        startedAt: 0,
        timeLimit: timeLimitFor(level, 0, false),
        spamCount: 0,
        taps: 0,
        curriculum: CURRICULUM,
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
        expect(answer(playing("true"), "true", 500, rng)).toMatchObject({
            startedAt: 500,
            timeLimit: timeLimitFor(2, 0, false),
        });
    });

    it("keeps the order of new modifiers for the whole game", () => {
        const started = startGame(0, rng);
        if (started.phase !== "playing") throw new Error("Game did not start");
        const spam = { ...playing("spam"), curriculum: started.curriculum, spamCount: SPAM_PRESSES_NEEDED - 1 };

        expect(answer(playing("true"), "true", 500, rng)).toMatchObject({ curriculum: CURRICULUM });
        expect(tick(playing("none"), 1e6, rng)).toMatchObject({ curriculum: CURRICULUM });
        expect(answer(spam, "true", 0, rng)).toMatchObject({ phase: "spamPause", curriculum: started.curriculum });
    });

    it("speeds up the animated modifiers with the level, each from its own introduction", () => {
        for (let run = 0; run < 200; run++) {
            const next = answer(playing("true", 40), "true", 100, rng);
            if (next.phase !== "playing") throw new Error("Level 41 did not start");

            for (const id of groupsOf(next.challenge.modifiers)) {
                expect(next.challenge.tempo[id]).toBe(tempoFor(41, introLevel(CURRICULUM, id)));
            }
        }
    });

    it("ends the game on a wrong answer with the solved levels as score", () => {
        expect(answer(playing("true", 4), "false", 100, rng)).toEqual({ phase: "gameOver", score: 3, endedAt: 100 });
    });

    it("ends the game when the time runs out", () => {
        const state = playing("true");

        expect(tick(state, state.timeLimit, rng)).toBe(state);
        expect(tick(state, state.timeLimit + 1, rng)).toEqual({
            phase: "gameOver",
            score: 0,
            endedAt: state.timeLimit + 1,
        });
    });

    it("does not accept an answer that comes after the time ran out", () => {
        const late = playing("true").timeLimit + 1;

        expect(answer(playing("true"), "true", late, rng)).toEqual({ phase: "gameOver", score: 0, endedAt: late });
        expect(levelOf(answer(playing("none"), "true", late, rng))).toBe(2);
        expect(answer(playing("spam"), "true", late, rng).phase).toBe("gameOver");
    });

    it("advances when nothing is pressed during a no-click challenge", () => {
        const state = playing("none");

        expect(levelOf(tick(state, state.timeLimit + 1, rng))).toBe(2);
    });

    it("gives a no-click level only part of the time limit", () => {
        let noClickLevels = 0;
        for (let run = 0; run < 300; run++) {
            // Level 42 introduces no group
            const next = answer(playing("true", 41), "true", 100, rng);
            if (next.phase !== "playing") throw new Error("Level 42 did not start");

            const limit = timeLimitFor(42, groupsOf(next.challenge.modifiers).length, false);
            if (next.challenge.expected === "none") {
                noClickLevels++;
                expect(next.timeLimit).toBe(Math.round(limit * NO_CLICK_TIME_SHARE));
            } else {
                expect(next.timeLimit).toBe(limit);
            }
        }
        expect(noClickLevels).toBeGreaterThan(0);
    });

    it("ends the game when anything is pressed during a no-click challenge", () => {
        expect(answer(playing("none"), "true", 100, rng).phase).toBe("gameOver");
        expect(answer(playing("none"), "false", 100, rng).phase).toBe("gameOver");
    });

    it("ends a WAIT level on a press before NOW and takes the answer after it", () => {
        const state = playing("true", 1, ["wait"]);
        const now = state.timeLimit * WAIT_SHARE;

        expect(answer(state, "true", now - 1, rng).phase).toBe("gameOver");
        expect(levelOf(answer(state, "true", now, rng))).toBe(2);
        expect(answer(state, "false", now, rng).phase).toBe("gameOver");
    });

    it("needs two right taps on a DOUBLE TAP level, however far apart", () => {
        const state = playing("true", 1, ["doubleTap"]);
        const first = answer(state, "true", 10, rng);

        expect(DOUBLE_TAPS).toBe(2);
        expect(first).toMatchObject({ phase: "playing", level: 1, taps: 1, startedAt: 0 });
        expect(levelOf(answer(first, "true", state.timeLimit, rng))).toBe(2);
        expect(answer(first, "false", 20, rng).phase).toBe("gameOver");
        expect(answer(state, "false", 10, rng).phase).toBe("gameOver");
        expect(tick(first, state.timeLimit + 1, rng).phase).toBe("gameOver");
    });

    it("shrinks the zoomed word with every level after its introduction", () => {
        const intro = introLevel(CURRICULUM, "zoom");
        const sizes: number[] = [];
        for (const level of [intro - 1, intro, intro + 1]) {
            for (let run = 0; run < 200; run++) {
                const next = answer({ ...playing("true", level - 1), curriculum: CURRICULUM }, "true", 0, rng);
                if (next.phase === "playing" && next.challenge.modifiers.has("zoom")) {
                    sizes.push(next.challenge.size);
                    break;
                }
            }
        }

        expect(sizes[0]).toBe(ZOOM_SIZE);
        expect(sizes[1]).toBeLessThan(ZOOM_SIZE);
    });

    it("needs repeated presses for a spam challenge and pauses before the next level", () => {
        let state: GameState = playing("spam");
        for (let i = 1; i < SPAM_PRESSES_NEEDED; i++) {
            state = answer(state, i % 2 ? "true" : "false", 100, rng);
            expect(state).toMatchObject({ phase: "playing", level: 1, spamCount: i });
        }

        state = answer(state, "true", 100, rng);
        expect(state).toEqual({
            phase: "spamPause",
            level: 1,
            resumeAt: 100 + SPAM_BANG_MS + SPAM_PAUSE_MS,
            curriculum: CURRICULUM,
            groups: ["spam"],
        });
        if (state.phase !== "spamPause") throw new Error("expected the spam pause");

        // First the solved SPAM! stays lit, then STOP SPAMMING! shows
        expect(isSpamBang(state, 100)).toBe(true);
        expect(isSpamBang(state, 100 + SPAM_BANG_MS - 1)).toBe(true);
        expect(isSpamBang(state, 100 + SPAM_BANG_MS)).toBe(false);

        const end = 100 + SPAM_BANG_MS + SPAM_PAUSE_MS;
        expect(tick(state, end - 1, rng)).toBe(state);
        expect(tick(state, end, rng)).toMatchObject({
            phase: "playing",
            level: 2,
            startedAt: end,
        });
    });

    it("does not repeat the SPAM! level's modifiers right after the spam pause", () => {
        const spamPause: GameState = {
            phase: "spamPause",
            level: 44,
            resumeAt: 0,
            curriculum: CURRICULUM,
            groups: ["spam"],
        };
        for (let run = 0; run < 300; run++) {
            const next = tick(spamPause, 0, rng);
            if (next.phase !== "playing") throw new Error("Spam pause did not end");

            expect(groupsOf(next.challenge.modifiers)).not.toEqual(["spam"]);
        }
    });

    it("lights one character of SPAM! per press", () => {
        expect(SPAM_WORD).toHaveLength(SPAM_PRESSES_NEEDED);
    });

    it("ends the game when a spam challenge is not finished in time", () => {
        const state = answer(playing("spam"), "true", 100, rng);

        expect(tick(state, timeLimitFor(1, 0, false) + 1, rng).phase).toBe("gameOver");
    });

    it("ignores answers and time outside of a running level", () => {
        const over: GameState = { phase: "gameOver", score: 2, endedAt: 0 };

        expect(answer(MENU, "true", 0, rng)).toBe(MENU);
        expect(answer(over, "true", 0, rng)).toBe(over);
        expect(tick(MENU, 1e9, rng)).toBe(MENU);
        expect(tick(over, 1e9, rng)).toBe(over);
    });
});

describe("surge", () => {
    const banner: SurgeBannerState = {
        phase: "surgeBanner",
        level: SURGE_FIRST_LEVEL,
        resumeAt: 100 + SURGE_BANNER_MS,
        curriculum: CURRICULUM,
    };

    it("shows the banner after the level before a surge", () => {
        expect(answer(playing("true", SURGE_FIRST_LEVEL - 1), "true", 100, rng)).toEqual(banner);
        expect(tick(playing("none", SURGE_FIRST_LEVEL - 1), 1e6, rng)).toMatchObject({
            phase: "surgeBanner",
            resumeAt: 1e6 + SURGE_BANNER_MS,
        });
        const spamPause: GameState = {
            phase: "spamPause",
            level: SURGE_FIRST_LEVEL - 1,
            resumeAt: 100,
            curriculum: CURRICULUM,
            groups: ["spam"],
        };
        expect(tick(spamPause, 100, rng)).toEqual(banner);
    });

    it("starts the surge level when the banner is gone, with its stacked groups and its fixed time", () => {
        expect(tick(banner, banner.resumeAt - 1, rng)).toBe(banner);

        const surge = tick(banner, banner.resumeAt, rng);
        if (surge.phase !== "playing") throw new Error("Surge did not start");
        // One of the stacked groups may be Don't Click, which shortens the time like on any other level
        expect(surge).toMatchObject({
            level: SURGE_FIRST_LEVEL,
            startedAt: banner.resumeAt,
            timeLimit:
                surge.challenge.expected === "none" ? Math.round(SURGE_TIME_MS * NO_CLICK_TIME_SHARE) : SURGE_TIME_MS,
        });
        expect(groupsOf(surge.challenge.modifiers)).toHaveLength(surgeGroupCount(SURGE_FIRST_LEVEL));
    });

    it("ignores answers during the banner", () => {
        expect(answer(banner, "true", 200, rng)).toBe(banner);
        expect(confirm(banner, 200, rng)).toBe(banner);
    });
});

describe("pause", () => {
    it("resumes the same challenge with the remaining time", () => {
        const state = playing("true");
        const paused = pause(state, 1000);
        expect(paused.phase).toBe("paused");

        const resumed = resume(paused, 61000);
        expect(resumed).toEqual({ ...state, startedAt: 60000 });
        expect(tick(resumed, 60000 + state.timeLimit, rng)).toBe(resumed);
        expect(tick(resumed, 60000 + state.timeLimit + 1, rng).phase).toBe("gameOver");
    });

    it("keeps the spam count while paused", () => {
        const state = answer(playing("spam"), "true", 100, rng);
        expect(resume(pause(state, 200), 5200)).toMatchObject({ spamCount: 1, startedAt: 5000 });
    });

    it("also delays the end of the spam pause", () => {
        const state: GameState = { phase: "spamPause", level: 3, resumeAt: 1000, curriculum: CURRICULUM, groups: [] };
        const resumed = resume(pause(state, 500), 10500);

        expect(resumed).toEqual({ ...state, resumeAt: 11000 });
    });

    it("also delays the end of the surge banner", () => {
        const state: GameState = { phase: "surgeBanner", level: 50, resumeAt: 1000, curriculum: CURRICULUM };
        const resumed = resume(pause(state, 500), 10500);

        expect(resumed).toEqual({ ...state, resumeAt: 11000 });
    });

    it("ignores answers and time while paused", () => {
        const paused = pause(playing("true"), 1000);

        expect(answer(paused, "true", 1100, rng)).toBe(paused);
        expect(tick(paused, 1e9, rng)).toBe(paused);
    });

    it("only pauses a running level", () => {
        const over: GameState = { phase: "gameOver", score: 1, endedAt: 0 };

        expect(pause(MENU, 0)).toBe(MENU);
        expect(pause(over, 0)).toBe(over);
        const paused = pause(playing("true"), 0);
        expect(pause(paused, 500)).toBe(paused);
        expect(resume(MENU, 0)).toBe(MENU);
    });
});

describe("confirm", () => {
    it("starts the game from the menu", () => {
        expect(confirm(MENU, 50, rng)).toMatchObject({ phase: "playing", level: 1, startedAt: 50 });
    });

    it("resumes a paused game", () => {
        expect(confirm(pause(playing("true"), 100), 400, rng)).toMatchObject({ phase: "playing", startedAt: 300 });
    });

    it("retries after game over, but not right away", () => {
        const over: GameState = { phase: "gameOver", score: 4, endedAt: 1000 };

        expect(confirm(over, 1000 + GAME_OVER_LOCK_MS - 1, rng)).toBe(over);
        expect(confirm(over, 1000 + GAME_OVER_LOCK_MS, rng)).toMatchObject({ phase: "playing", level: 1 });
    });

    it("does nothing during a level or the spam pause", () => {
        const state = playing("true");
        const spamPause: GameState = {
            phase: "spamPause",
            level: 1,
            resumeAt: 100,
            curriculum: CURRICULUM,
            groups: [],
        };

        expect(confirm(state, 10, rng)).toBe(state);
        expect(confirm(spamPause, 10, rng)).toBe(spamPause);
    });
});

describe("toMenu", () => {
    it("leaves the game over screen for the menu, but not right away", () => {
        const over: GameState = { phase: "gameOver", score: 4, endedAt: 1000 };

        expect(toMenu(over, 1000 + GAME_OVER_LOCK_MS - 1)).toBe(over);
        expect(toMenu(over, 1000 + GAME_OVER_LOCK_MS)).toBe(MENU);
    });

    it("does nothing outside of game over", () => {
        const state = playing("true");

        expect(toMenu(state, 1e9)).toBe(state);
        expect(toMenu(MENU, 1e9)).toBe(MENU);
    });
});
