import { Game, GameState } from "./gameState.ts";
import { GameLoopStateInstance as GLS } from "./gameLoopState.ts";
import { renderGameMenu } from "../ui/renderGameMenu.ts";
import { renderGame } from "../ui/renderGame.ts";
import { showGameOver } from "../ui/showGameOver.ts";
import { renderWaitAfterSpam } from "../ui/renderWaitAfterSpam.ts";
import { setInputs } from "./inputHandler.ts";
import { updateGame } from "./gameLoop.ts";
import { getHighscore } from "./highscore.ts";

function mainLoop(): void {
    switch (Game.state) {
        case GameState.MENU:
            renderGameMenu();
            break;
        case GameState.PLAYING:
            updateGame();
            renderGame();
            break;
        case GameState.WAIT_AFTER_SPAM:
            renderWaitAfterSpam();
            break;
        case GameState.GAME_OVER:
            // Jeden Frame neu zeichnen, sonst bleibt der Screen nach einem Resize leer
            showGameOver(GLS.score, getHighscore());
            break;
    }
    requestAnimationFrame(mainLoop);
}

export function gameStart(): void {
    setInputs();
    requestAnimationFrame(mainLoop);
}
