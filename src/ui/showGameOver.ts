import { ctx, viewport } from "./canvasSetup.ts";

export function showGameOver(score: number, highscore: number): void {
    const { width, height } = viewport;
    const centerX = width / 2;
    const centerY = height / 2;

    // Schriftgrößen in Prozent der Breite, bei sehr breiten Fenstern durch die Höhe begrenzt
    const unit = Math.min(width, height * 1.8) / 100;

    ctx.clearRect(0, 0, width, height);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#000";

    // "Game Over" Titel
    ctx.font = `bold ${8 * unit}px sans-serif`;
    ctx.fillText("Game Over", centerX, centerY - 8 * unit);

    // Ergebnis dieser Runde und Highscore
    ctx.font = `bold ${4 * unit}px sans-serif`;
    ctx.fillText(`Score: ${score}`, centerX, centerY - 0.5 * unit);
    ctx.fillText(`Highscore: ${highscore}`, centerX, centerY + 4.5 * unit);

    // Hinweis zum Neustart
    ctx.font = `bold ${3 * unit}px sans-serif`;
    ctx.fillText("(Press Enter to try again)", centerX, centerY + 11 * unit);
}
