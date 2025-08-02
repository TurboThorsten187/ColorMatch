import { Game, GameState } from "./gameState.js";
import { renderGameMenu } from "../ui/renderGameMenu.js";
import { renderGame } from "../ui/renderGame.js";
import { showGameOver } from "../ui/showGameOver.js";
import { renderWaitAfterSpam } from "../ui/renderWaitAfterSpam.js";
import { setInputs } from "./inputHandler.js";
import { updateGame } from "./gameLoop.js";
import { getHighscore } from "./highscore.js";

let gameOverRendered = false;

function mainLoop() {
    switch (Game.state) {
        case GameState.MENU:
            renderGameMenu();
            if(gameOverRendered) {
                gameOverRendered = false;
            }
            break;
        case GameState.PLAYING:
            updateGame();
            renderGame();
            break;
        case GameState.WAIT_AFTER_SPAM:
            renderWaitAfterSpam();
            break;
        case GameState.GAME_OVER:
            if(!gameOverRendered) {
                gameOverRendered = true;
                showGameOver(getHighscore());
            }
            break;
    }
    requestAnimationFrame(mainLoop);
}

export function gameStart() {
    setInputs();
    requestAnimationFrame(mainLoop);
}