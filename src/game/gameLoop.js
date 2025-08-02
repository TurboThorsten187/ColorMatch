import { GameLoopStateInstance as GLS } from "./gameLoopState.js";
import { GameState , Game} from "./gameState.js";
import { Challenge } from "./challenge.js";
import { applyLogicModifiers } from "./modifierHandler.js";
import { InputType } from "./challenge.js";
import { ALL_MODIFIERS } from "../modifiers/modifiers.js";
import { setHighscore } from "./highscore.js";

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
        gameOver();
        return;
    }

    if (correctInput === InputType.SPAM) {
        GLS.spamCount = (GLS.spamCount || 0) + 1;

        if (GLS.spamCount >= 5) {
            Game.state = GameState.WAIT_AFTER_SPAM;
            GLS.spamCount = 0;

            setTimeout(() => {
                Game.state = GameState.PLAYING;
                nextLevel();
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
        nextLevel();
    } else {
        gameOver();
    }
}

export function updateGame() {
    const now = Date.now();

    if (now - GLS.decisionStartTime > GLS.timer) { //Times up
        if (GLS.currentChallenge.correctInput === InputType.NONE) {
            nextLevel();
        } else {
            gameOver();
        }
    }
}

function gameOver() {
    setHighscore(GLS.currentLevel);
    Game.state = GameState.GAME_OVER;
}

function nextLevel() {
    GLS.incrementLevel();
    updateChallenge();
    GLS.inputReceived = false;
    GLS.spamCount = 0;
    GLS.timer = Math.max(1500, 3000 - GLS.currentLevel * 50);
    GLS.decisionStartTime = Date.now();
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
    GLS.activeModifiers = pickModifiers(GLS.currentLevel);
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

    const namesToTest = [
        "InvertInputModifier",
        "BackgroundColorModifier"
    ];

    const picked = ALL_MODIFIERS.filter(mod => namesToTest.includes(mod.name));
    GLS.activeModifiers = picked;

    return picked;
}
