import type { Challenge } from "./challenge.ts";
import type { Modifier } from "../modifiers/modifiers.ts";

class GameLoopState {
    currentChallenge: Challenge | null = null;
    activeModifiers: readonly Modifier[] = [];
    currentLevel = 1;
    timer = 3000;
    inputReceived = false;
    decisionStartTime = Date.now();
    spamCount = 0;

    reset(): void {
        this.currentChallenge = null;
        this.activeModifiers = [];
        this.currentLevel = 1;
        this.timer = 3000;
        this.inputReceived = false;
        this.decisionStartTime = Date.now();
        this.spamCount = 0;
    }

    // Anzahl der geschafften Level
    get score(): number {
        return this.currentLevel - 1;
    }

    incrementLevel(): void {
        this.currentLevel++;
    }
}

export const GameLoopStateInstance = new GameLoopState();
