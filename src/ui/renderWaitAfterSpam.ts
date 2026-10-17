import { ctx, viewport } from "./canvasSetup.ts";
import { fitText } from "./fitText.ts";

const TEXT = "Stop spamming!";

export function renderWaitAfterSpam(): void {
    const { width, height } = viewport;

    // === Canvas löschen ===
    ctx.clearRect(0, 0, width, height);

    // === Schriftgröße relativ zur Höhe, bei schmalen Fenstern an die Breite angepasst ===
    let fontSize = height * 0.18;
    fontSize *= fitText([{ text: TEXT, fontSize }], width * 0.9);

    // === Schrift und Text zeichnen ===
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(TEXT, width / 2, height / 2);
}
