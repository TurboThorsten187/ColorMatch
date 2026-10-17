import { evaluateInput, startGame } from "./gameLoop.ts";
import { Game, GameState } from "./gameState.ts";

export function setInputs(): void {
    window.addEventListener("keydown", (event) => {
        // Gedrückt gehaltene Tasten feuern wiederholt keydown – das zählt nicht als neue Eingabe
        if (event.repeat) return;

        const key = event.key;

        switch (Game.state) {
            case GameState.MENU:
                if (key === "Enter") {
                    startGame();
                }
                break;

            case GameState.PLAYING:
                if (key === "ArrowLeft" || key === "ArrowRight") {
                    event.preventDefault();
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
}
