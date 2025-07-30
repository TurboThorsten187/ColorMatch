import { GameLoopStateInstance as GLS } from "./gameLoopState.js";
import { GameState , Game} from "./gameState.js";
import { Challenge } from "./challenge.js";

const Colors = Object.freeze({
    RED: "red",
    GREEN: "green",
    BLUE: "blue",
    YELLOW: "yellow",
    PURPLE: "purple",
    CYAN: "cyan"
});


export function evaluateInput(key) {
    if (GLS.inputReceived) return;

    GLS.inputReceived = true;

    const correctInput = GLS.correctInput;
    if (key === "ArrowLeft" && correctInput ||
        key === "ArrowRight" && !correctInput) {
        GLS.incrementLevel();
        
        updateChallenge();

        GLS.inputReceived = false;
        GLS.decisionStartTime = Date.now();
    } 
    else {
        Game.state = GameState.GAME_OVER;
    }
}

export function updateGame() {
    if (Game.state !== GameState.PLAYING) return;

    const now = Date.now();
    const elapsed = now - GLS.decisionStartTime;

    if (!GLS.inputReceived && elapsed > GLS.timer) {
        Game.state = GameState.GAME_OVER;
    }
}

function createNewChallenge() {
    const colorValues = Object.values(Colors);
    const color = colorValues[Math.floor(Math.random() * colorValues.length)];

    let text = color;
    let correctInput = true;

    if (Math.random() < 0.5) {
        const otherColors = colorValues.filter(c => c !== color);
        text = otherColors[Math.floor(Math.random() * otherColors.length)];
        correctInput = false;
    }

    return new Challenge(text, color, correctInput);
}

export function updateChallenge() {
    if (Game.state !== GameState.PLAYING) return;

    GLS.currentChallenge = createNewChallenge();
    GLS.currentChallenge = applyModifiers(GLS.currentChallenge);
    GLS.correctInput = GLS.currentChallenge.correctInput;
}

export function applyModifiers(challenge) {
    GLS.activeModifiers.forEach(modifier => {
        challenge = modifier.apply(challenge);
    });
    return challenge;
}

export function pickModifiers(level) {
    GLS.activeModifiers = [];

    const maxModifierCount = Math.min(3, Math.floor(level / 10) + 1);
    const modifierCount = Math.floor(Math.random() * (maxModifierCount + 1));

    const available = ALL_MODIFIERS.filter(mod => level >= mod.minLevel);
    if (available.length === 0) return;

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

    GLS.activeModifiers = picked;
}