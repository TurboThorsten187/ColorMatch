import { Game, GameState } from "./gameState.js";
import { renderGameMenu } from "../ui/renderGameMenu.js";
import { renderGame } from "../ui/renderGame.js";
import { renderGameOver } from "../ui/renderGameOver.js";
import { setInputs } from "./inputHandler.js";
import { updateGame } from "./gameLoop.js";


function mainLoop() {
    switch (Game.state) {
        case GameState.MENU:
            renderGameMenu();
            break;
        case GameState.PLAYING:
            updateGame();
            renderGame();
            break;
        case GameState.GAME_OVER:
            renderGameOver();
            break;
    }
    //requestAnimationFrame(mainLoop);
}

export function gameStart() {
    setInputs();
    requestAnimationFrame(mainLoop);
}