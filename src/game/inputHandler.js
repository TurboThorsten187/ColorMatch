import { evaluateInput, updateChallenge } from "./gameLoop.js";
import { GameState, Game } from "./gameState.js";
import { GameLoopStateInstance as GLS } from "./gameLoopState.js";

let inputLocked = false;

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
                if ((key === "ArrowLeft" || key === "ArrowRight") && !inputLocked) {
                    inputLocked = true;
                    evaluateInput(key);
                }
                break;

            case GameState.WAIT_AFTER_SPAM:
                break;


            case GameState.GAME_OVER:
                if (key === "Enter") {
                    Game.state = GameState.MENU;
                }
                break;
        }
    });

    addEventListener("keyup", (event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            inputLocked = false;
        }
    });
}
