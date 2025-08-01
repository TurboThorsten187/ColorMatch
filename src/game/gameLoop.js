import { GameLoopStateInstance as GLS } from "./gameLoopState.js";
import { GameState , Game} from "./gameState.js";
import { Challenge } from "./challenge.js";
import { applyLogicModifiers } from "./modifierHandler.js";
import { InputType } from "./challenge.js";
import { ALL_MODIFIERS } from "../modifiers/modifiers.js";

export const Colors = Object.freeze({
    RED: "red",
    GREEN: "green",
    BLUE: "blue",
    YELLOW: "yellow",
    PURPLE: "purple",
    CYAN: "cyan"
});


export function evaluateInput(key) {
    if (GLS.inputReceived) return;

    const correctInput = GLS.currentChallenge.correctInput;

    if (correctInput === InputType.NONE) {
        Game.state = GameState.GAME_OVER;
        return;
    }

    if (correctInput === InputType.SPAM) {
        GLS.spamCount = (GLS.spamCount || 0) + 1;

        if (GLS.spamCount >= 5) {
            Game.state = GameState.WAIT_AFTER_SPAM;
            GLS.spamCount = 0;

            setTimeout(() => {
                GLS.incrementLevel();
                updateChallenge();
                GLS.inputReceived = false;
                GLS.decisionStartTime = Date.now();
                Game.state = GameState.PLAYING;
            }, 1000);

            return;
        }
        return;
    }


    GLS.inputReceived = true;

    const isCorrect = (
        (key === "ArrowLeft" && correctInput === InputType.TRUE) ||
        (key === "ArrowRight" && correctInput === InputType.FALSE)
    );

    if (isCorrect) {
        GLS.incrementLevel();
        updateChallenge();
        GLS.inputReceived = false;
        GLS.decisionStartTime = Date.now();
    } else {
        Game.state = GameState.GAME_OVER;
    }
}

export function updateGame() {
    const now = Date.now();

    if (now - GLS.decisionStartTime > GLS.timer) {
        if (GLS.currentChallenge.correctInput === InputType.NONE) {
            GLS.incrementLevel();
            updateChallenge();
            GLS.inputReceived = false;
            GLS.decisionStartTime = now;
        } else if (GLS.currentChallenge.correctInput === InputType.SPAM) {
            if ((GLS.spamCount || 0) < 5) {
                Game.state = GameState.GAME_OVER;
            } else {
                GLS.incrementLevel();
                updateChallenge();
                GLS.inputReceived = false;
                GLS.decisionStartTime = now;
                GLS.spamCount = 0;
            }
        } else {
            Game.state = GameState.GAME_OVER;
        }
    }
}


function createNewChallenge() {
    const colorValues = Object.values(Colors);
    const color = colorValues[Math.floor(Math.random() * colorValues.length)];

    let text = color;
    let correctInput = InputType.TRUE;

    if (Math.random() < 0.5) {
        const otherColors = colorValues.filter(c => c !== color);
        text = otherColors[Math.floor(Math.random() * otherColors.length)];
        correctInput = InputType.FALSE;
    }

    return new Challenge(text, color, correctInput);
}

export function updateChallenge() {
    if (Game.state !== GameState.PLAYING) return;

    GLS.currentChallenge = createNewChallenge();
    GLS.activeModifiers = testpickModifiers(GLS.currentLevel);
    GLS.currentChallenge.correctInput = applyLogicModifiers(GLS.currentChallenge);
}

export function pickModifiers(level) {
    GLS.activeModifiers = [];

    const maxModifierCount = Math.min(3, Math.floor(level / 10) + 1);
    const modifierCount = Math.floor(Math.random() * (maxModifierCount + 1));

    const available = ALL_MODIFIERS.filter(mod => level >= mod.minLevel);
    if (available.length === 0) return null;

    const picked = [];

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

export function testpickModifiers(level) {
    GLS.activeModifiers = [];
    const picked = [ALL_MODIFIERS.find(mod => mod.name === "NoClickModifier")];

    return picked;
}