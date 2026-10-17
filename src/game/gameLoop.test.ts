import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateInput, pickModifiers, startGame, updateGame } from "./gameLoop.ts";
import { GameLoopStateInstance as GLS } from "./gameLoopState.ts";
import { Game, GameState } from "./gameState.ts";
import { InputType } from "./challenge.ts";
import { getHighscore } from "./highscore.ts";

function setCorrectInput(correctInput: InputType): void {
    GLS.currentChallenge = { text: "red", color: "red", correctInput };
}

function createMemoryStorage(): Pick<Storage, "getItem" | "setItem"> {
    const data = new Map<string, string>();
    return {
        getItem: key => data.get(key) ?? null,
        setItem: (key, value) => void data.set(key, value),
    };
}

describe("game loop", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubGlobal("localStorage", createMemoryStorage());
        Game.state = GameState.MENU;
        startGame();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it("starts at level 1 with a challenge", () => {
        expect(Game.state).toBe(GameState.PLAYING);
        expect(GLS.currentLevel).toBe(1);
        expect(GLS.currentChallenge).not.toBeNull();
    });

    it("advances on ArrowLeft for a matching word", () => {
        setCorrectInput(InputType.TRUE);
        evaluateInput("ArrowLeft");
        expect(GLS.currentLevel).toBe(2);
        expect(Game.state).toBe(GameState.PLAYING);
    });

    it("advances on ArrowRight for a non-matching word", () => {
        setCorrectInput(InputType.FALSE);
        evaluateInput("ArrowRight");
        expect(GLS.currentLevel).toBe(2);
    });

    it("ends the game on a wrong answer", () => {
        setCorrectInput(InputType.TRUE);
        evaluateInput("ArrowRight");
        expect(Game.state).toBe(GameState.GAME_OVER);
    });

    it("ends the game when the time runs out", () => {
        setCorrectInput(InputType.TRUE);
        vi.advanceTimersByTime(GLS.timer + 1);
        updateGame();
        expect(Game.state).toBe(GameState.GAME_OVER);
    });

    it("advances when nothing is pressed during a no-click challenge", () => {
        setCorrectInput(InputType.NONE);
        vi.advanceTimersByTime(GLS.timer + 1);
        updateGame();
        expect(Game.state).toBe(GameState.PLAYING);
        expect(GLS.currentLevel).toBe(2);
    });

    it("ends the game when a key is pressed during a no-click challenge", () => {
        setCorrectInput(InputType.NONE);
        evaluateInput("ArrowLeft");
        expect(Game.state).toBe(GameState.GAME_OVER);
    });

    it("needs five presses for a spam challenge and pauses before the next level", () => {
        setCorrectInput(InputType.SPAM);
        for (let i = 0; i < 4; i++) evaluateInput(i % 2 ? "ArrowLeft" : "ArrowRight");
        expect(Game.state).toBe(GameState.PLAYING);
        expect(GLS.currentLevel).toBe(1);

        evaluateInput("ArrowLeft");
        expect(Game.state).toBe(GameState.WAIT_AFTER_SPAM);

        vi.advanceTimersByTime(1000);
        expect(Game.state).toBe(GameState.PLAYING);
        expect(GLS.currentLevel).toBe(2);
    });

    it("stores the number of solved levels as highscore", () => {
        for (let i = 0; i < 3; i++) {
            setCorrectInput(InputType.TRUE);
            evaluateInput("ArrowLeft");
        }
        setCorrectInput(InputType.TRUE);
        evaluateInput("ArrowRight");

        expect(GLS.score).toBe(3);
        expect(getHighscore()).toBe(3);
    });
});

describe("pickModifiers", () => {
    it("picks nothing before level 5", () => {
        for (let level = 1; level < 5; level++) {
            expect(pickModifiers(level)).toEqual([]);
        }
    });

    it("respects level limits, max count and conflicts", () => {
        for (let level = 1; level <= 60; level++) {
            for (let run = 0; run < 200; run++) {
                const picked = pickModifiers(level);

                expect(picked.length).toBeLessThanOrEqual(Math.min(3, Math.floor(level / 10) + 1));
                expect(new Set(picked.map(m => m.name)).size).toBe(picked.length);

                for (const mod of picked) {
                    expect(mod.minLevel).toBeLessThanOrEqual(level);
                    for (const other of picked) {
                        expect(mod.conflictsWith).not.toContain(other.name);
                    }
                }
            }
        }
    });
});
