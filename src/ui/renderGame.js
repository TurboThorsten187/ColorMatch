import { GameLoopStateInstance as GLS } from "../game/gameLoopState.js";

export function renderGame() {
    console.log("Currentl Level:" + GLS.currentLevel);
}