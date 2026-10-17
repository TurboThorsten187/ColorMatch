import { GameLoopStateInstance as GLS } from "./gameLoopState.ts";
import { Game, GameState } from "./gameState.ts";
import { createChallenge, InputType } from "./challenge.ts";
import { applyLogicModifiers } from "./modifierHandler.ts";
import { ALL_MODIFIERS, type Modifier } from "../modifiers/modifiers.ts";
import { saveHighscore } from "./highscore.ts";

export type AnswerKey = "ArrowLeft" | "ArrowRight";

const SPAM_PRESSES_NEEDED = 5;
const SPAM_PAUSE_MS = 1000;

export function startGame(): void {
    Game.state = GameState.PLAYING;
    GLS.reset();
    updateChallenge();
}

export function evaluateInput(key: AnswerKey): void {
    const challenge = GLS.currentChallenge;
    if (GLS.inputReceived || !challenge) return;

    const correctInput = challenge.correctInput;

    if (correctInput === InputType.NONE) {
        gameOver();
        return;
    }

    if (correctInput === InputType.SPAM) {
        GLS.spamCount++;

        if (GLS.spamCount >= SPAM_PRESSES_NEEDED) {
            Game.state = GameState.WAIT_AFTER_SPAM;
            GLS.spamCount = 0;

            setTimeout(() => {
                Game.state = GameState.PLAYING;
                nextLevel();
            }, SPAM_PAUSE_MS);
        }
        return;
    }

    GLS.inputReceived = true;

    const isCorrect = (
        (key === "ArrowLeft" && correctInput === InputType.TRUE) ||
        (key === "ArrowRight" && correctInput === InputType.FALSE)
    );

    if (isCorrect) {
        nextLevel();
    } else {
        gameOver();
    }
}

export function updateGame(): void {
    const challenge = GLS.currentChallenge;
    if (!challenge) return;

    if (Date.now() - GLS.decisionStartTime > GLS.timer) { // Zeit abgelaufen
        if (challenge.correctInput === InputType.NONE) {
            nextLevel();
        } else {
            gameOver();
        }
    }
}

function gameOver(): void {
    saveHighscore(GLS.score);
    Game.state = GameState.GAME_OVER;
}

function nextLevel(): void {
    GLS.incrementLevel();
    updateChallenge();
    GLS.inputReceived = false;
    GLS.spamCount = 0;
    GLS.timer = Math.max(1500, 3000 - GLS.currentLevel * 50);
    GLS.decisionStartTime = Date.now();
}

function updateChallenge(): void {
    if (Game.state !== GameState.PLAYING) return;

    const challenge = createChallenge();
    GLS.activeModifiers = pickModifiers(GLS.currentLevel);
    GLS.currentChallenge = {
        ...challenge,
        correctInput: applyLogicModifiers(challenge.correctInput, GLS.activeModifiers),
    };
}

export function pickModifiers(level: number): Modifier[] {
    const maxModifierCount = Math.min(3, Math.floor(level / 10) + 1);
    const modifierCount = Math.floor(Math.random() * (maxModifierCount + 1));

    const available = ALL_MODIFIERS.filter(mod => level >= mod.minLevel);
    const picked: Modifier[] = [];

    while (picked.length < modifierCount && available.length > 0) {
        const idx = Math.floor(Math.random() * available.length);
        const candidate = available[idx];

        const conflict = picked.some(p =>
            p.conflictsWith.includes(candidate.name) ||
            candidate.conflictsWith.includes(p.name)
        );

        if (!conflict) {
            picked.push(candidate);
        }

        available.splice(idx, 1);
    }

    return picked;
}
