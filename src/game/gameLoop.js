import { GameLoopStateInstance as GLS } from "./gameLoopState.js";
import { GameState , Game} from "./gameState.js";



export function evaluateInput(key) {
    if (GLS.inputReceived) return;

    GLS.inputReceived = true;

    const correctInput = GLS.correctInput;
    if (key === "ArrowLeft" && correctInput ||
        key === "ArrowRight" && !correctInput) {
        GLS.incrementLevel();
        GLS.toggleCorrectInput();
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