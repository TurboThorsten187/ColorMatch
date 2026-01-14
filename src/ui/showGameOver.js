import { canvas, ctx } from "./canvasSetup.js";

export function showGameOver(highscore) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#000";

    // "Game Over" Titel
    ctx.font = "bold 8vw sans-serif";
    ctx.fillText("Game Over", centerX, centerY - 80);

    // Highscore-Anzeige
    ctx.font = "bold 4vw sans-serif";
    ctx.fillText(`Highscore: ${highscore}`, centerX, centerY + 20);

    // Hinweis zum Neustart
    ctx.font = "bold 3vw sans-serif";
    ctx.fillText("(Press Enter to try again)", centerX, centerY + 100);
}
