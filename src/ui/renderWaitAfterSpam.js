import { canvas, ctx } from "./canvasSetup.js";

export function renderWaitAfterSpam() {
    // === Canvas löschen ===
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // === Transformation vorbereiten ===
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);

    // === Skalierung für Schriftgrößen relativ zur Canvas-Höhe ===
    const baseHeight = 800;
    const scale = (canvas.height / baseHeight) * 3;
    const fontSize = 48 * scale;

    // === Schrift und Text zeichnen ===
    ctx.font = `bold ${fontSize}px "Core Sans G 65 Bold", sans-serif`;
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Stop spamming!", 0, 0);

    // === Transformation zurücksetzen ===
    ctx.restore();
}
