import { describe, expect, it } from "vitest";
import { MODIFIER_GROUPS } from "@/modifiers/registry.ts";
import type { ModifierId } from "@/modifiers/types.ts";
import { WAIT_SHARE } from "@/modifiers/wait/wait.ts";
import { GAME_OVER_LOCK_MS, SURGE_BANNER_MS, SURGE_FIRST_LEVEL } from "./balance.ts";
import type { ExpectedInput } from "./challenge.ts";
import { gameEvents } from "./events.ts";
import { answer, confirm, type GameState, MENU, pause, type PlayingState, resume, startGame, tick } from "./game.ts";
import { seededRng } from "./random.ts";
import { testChallenge } from "./testChallenge.ts";

const rng = seededRng(3);

function playing(expected: ExpectedInput, level = 1, modifiers: readonly ModifierId[] = []): PlayingState {
    return {
        phase: "playing",
        mode: "normal",
        level,
        challenge: testChallenge(expected, expected === "spam" ? ["spam"] : modifiers),
        startedAt: 1000,
        timeLimit: 3000,
        spamCount: 0,
        taps: 0,
        curriculum: MODIFIER_GROUPS.map((group) => group.id),
    };
}

// The events of applying `transition` to `state` at `now`
function eventsOf(state: GameState, now: number, transition: (state: GameState) => GameState) {
    return gameEvents(state, transition(state), now);
}

describe("game events", () => {
    it("are none when nothing changed", () => {
        const state = playing("true");

        expect(gameEvents(state, state, 1500)).toEqual([]);
        expect(eventsOf(state, 1500, (s) => tick(s, 1500, rng))).toEqual([]);
    });

    it("start a game with its first level", () => {
        const next = startGame(0, rng, "hardcore");

        expect(gameEvents(MENU, next, 0)).toEqual([
            { kind: "started", mode: "hardcore" },
            { kind: "levelBegan", level: next },
        ]);
    });

    it("clear a level with the reaction time and begin the next one", () => {
        const state = playing("true");
        const next = answer(state, "true", 1400, rng);

        expect(gameEvents(state, next, 1400)).toEqual([
            { kind: "cleared", level: state, reactionMs: 400 },
            { kind: "levelBegan", level: next },
        ]);
    });

    it("count the reaction on a WAIT level from NOW", () => {
        const state = playing("true", 1, ["wait"]);
        const at = state.startedAt + state.timeLimit * WAIT_SHARE + 250;

        expect(eventsOf(state, at, (s) => answer(s, "true", at, rng))[0]).toEqual({
            kind: "cleared",
            level: state,
            reactionMs: 250,
        });
    });

    it("clear a sat out Don't Click level without a reaction time", () => {
        const state = playing("none");
        const at = state.startedAt + state.timeLimit + 1;

        expect(eventsOf(state, at, (s) => tick(s, at, rng))[0]).toEqual({
            kind: "cleared",
            level: state,
            reactionMs: null,
        });
    });

    it("count SPAM! presses and clear the level with the last one", () => {
        let state: GameState = playing("spam");
        const taps: unknown[] = [];
        for (let press = 0; press < 5; press++) {
            const next = answer(state, "true", 1100, rng);
            taps.push(
                ...gameEvents(state, next, 1100).map((event) => event.kind + ("count" in event ? event.count : "")),
            );
            state = next;
        }

        expect(taps).toEqual(["spamTap1", "spamTap2", "spamTap3", "spamTap4", "cleared"]);
        if (state.phase !== "spamPause") throw new Error("expected the spam pause");
        const next = tick(state, state.resumeAt, rng);
        expect(gameEvents(state, next, state.resumeAt)).toEqual([{ kind: "levelBegan", level: next }]);
    });

    it("announce a surge after the level before it and begin the surge after the banner", () => {
        const state = playing("true", SURGE_FIRST_LEVEL - 1);
        const banner = answer(state, "true", 1500, rng);

        expect(gameEvents(state, banner, 1500).map((event) => event.kind)).toEqual(["cleared", "surge"]);
        const surge = tick(banner, 1500 + SURGE_BANNER_MS, rng);
        expect(gameEvents(banner, surge, 1500 + SURGE_BANNER_MS)).toEqual([{ kind: "levelBegan", level: surge }]);
    });

    it("lose the game with the reason", () => {
        const state = playing("true", 4, ["wait"]);
        const over = answer(state, "true", 1100, rng);

        expect(gameEvents(state, over, 1100)).toEqual([{ kind: "lost", over }]);
        expect(over).toMatchObject({ reason: "early", score: 3, lost: state });
    });

    it("resume without beginning the level or the banner again", () => {
        const state = playing("true", 6, ["blur"]);
        const paused = pause(state, 2000);
        expect(gameEvents(state, paused, 2000)).toEqual([]);

        expect(gameEvents(paused, resume(paused, 5000), 5000)).toEqual([
            { kind: "resumed", pausedAt: 2000, pausedFor: 3000 },
        ]);
        const banner = answer(playing("true", SURGE_FIRST_LEVEL - 1), "true", 1500, rng);
        const pausedBanner = pause(banner, 1600);
        expect(gameEvents(pausedBanner, resume(pausedBanner, 1700), 1700).map((event) => event.kind)).toEqual([
            "resumed",
        ]);
    });

    it("start a game again with RETRY and go back with MENU", () => {
        const over = answer(playing("true"), "false", 1100, rng);
        const retry = confirm(over, 1100 + GAME_OVER_LOCK_MS, rng);

        expect(gameEvents(over, retry, 1100 + GAME_OVER_LOCK_MS).map((event) => event.kind)).toEqual([
            "started",
            "levelBegan",
        ]);
        expect(gameEvents(over, MENU, 1100 + GAME_OVER_LOCK_MS)).toEqual([{ kind: "menu" }]);
    });
});
