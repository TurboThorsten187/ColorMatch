import { ctx, viewport } from "./canvasSetup.ts";
import { type Color, randomColor } from "../game/colors.ts";

const TITLE = "ColorMatch";

// Jeder Buchstabe des Titels hat seine eigene Farbe
const titleColors: Color[] = Array.from(TITLE, () => randomColor());
let lastColorChange = Date.now();

export function renderGameMenu(): void {
    const now = Date.now();

    // Zufällig einzelne Buchstabenfarbe ca. alle 150ms ändern
    if (now - lastColorChange > 150) {
        const index = Math.floor(Math.random() * TITLE.length);
        titleColors[index] = randomColor();
        lastColorChange = now;
    }

    // === Canvas vorbereiten ===
    const { width, height } = viewport;
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;

    // Schriftgrößen in Prozent der Breite, bei sehr breiten Fenstern durch die Höhe begrenzt
    const unit = Math.min(width, height * 1.8) / 100;

    // === Titel vorbereiten ===
    ctx.font = `bold ${10 * unit}px monospace`;
    ctx.textAlign = "left";   // links ausrichten, da wir x genau berechnen wollen
    ctx.textBaseline = "middle";

    const letterSpacing = 0.8 * unit; // Abstand zwischen Buchstaben

    // Gesamtlänge berechnen: Summe aller Buchstabenbreiten + spacing dazwischen
    const letterWidths = Array.from(TITLE, letter => ctx.measureText(letter).width);
    const totalWidth = letterWidths.reduce((sum, w) => sum + w, 0) + letterSpacing * (TITLE.length - 1);

    // Startposition links vom Mittelpunkt
    let currentX = centerX - totalWidth / 2;

    // Einzelne Buchstaben zeichnen mit korrektem Abstand
    for (let i = 0; i < TITLE.length; i++) {
        ctx.fillStyle = titleColors[i];
        ctx.fillText(TITLE[i], currentX, centerY - height * 0.1);
        currentX += letterWidths[i] + letterSpacing;
    }

    // === Anleitungstext darunter ===
    ctx.font = `bold ${4 * unit}px sans-serif`;
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.fillText("← TRUE         FALSE →", centerX, centerY + height * 0.1);

    // === Neue Zeile: Press Enter to start mit mehr Abstand ===
    ctx.font = `bold ${3 * unit}px sans-serif`;
    ctx.fillStyle = "#333";
    ctx.fillText("(Press Enter to start)", centerX, centerY + height * 0.18);
}
