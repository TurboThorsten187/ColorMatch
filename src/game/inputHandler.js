import { evaluateInput, updateChallenge } from "./gameLoop.js";
import { GameState, Game } from "./gameState.js";
import { GameLoopStateInstance as GLS } from "./gameLoopState.js";

export function setInputs() {
    addEventListener("keydown", (event) => {
    const key = event.key;

    switch (Game.state) {
        case GameState.MENU:
            if (key === "Enter") {
                Game.state = GameState.PLAYING;
                GLS.reset();
                updateChallenge();
            }
            break;

        case GameState.PLAYING:
            if (key === "ArrowLeft" || key === "ArrowRight") {
                evaluateInput(key);
            }
            break;

        case GameState.GAME_OVER:
            if (key === "Enter") {
                Game.state = GameState.MENU;
            }
            break;
    }
});
}