import { GameLoopStateInstance as GLS } from "../game/gameLoopState.js";

export function renderGame() {
    console.log("Currentl Color:" + GLS.currentChallenge.color + " Text: " + GLS.currentChallenge.text + " Current Level: " + GLS.currentLevel);
}