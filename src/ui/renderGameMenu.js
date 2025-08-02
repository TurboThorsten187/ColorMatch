import { canvas, ctx } from "./canvasSetup.js";
import { Colors } from "../game/gameLoop.js";

// Initialer Menü-Zustand
const MenuState = {
    title: "ColorMatch",
    titleColors: [],
    lastUpdate: Date.now(),
};

// Alle möglichen Farben als Array
const colorList = Object.values(Colors);

// Initialisiere Farben beim ersten Aufruf
if (MenuState.titleColors.length === 0) {
    MenuState.titleColors = MenuState.title.split("").map(() =>
        colorList[Math.floor(Math.random() * colorList.length)]
    );
}

export function renderGameMenu() {
    const now = Date.now();

    // Zufällig einzelne Buchstabenfarbe ca. alle 150ms ändern
    if (now - MenuState.lastUpdate > 150) {
        const index = Math.floor(Math.random() * MenuState.title.length);
        MenuState.titleColors[index] =
            colorList[Math.floor(Math.random() * colorList.length)];
        MenuState.lastUpdate = now;
    }

    // === Canvas vorbereiten ===
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // === Titel vorbereiten ===
    const title = MenuState.title;
    ctx.font = "bold 10vw monospace";
    ctx.textAlign = "left";   // links ausrichten, da wir x genau berechnen wollen
    ctx.textBaseline = "middle";

    const letterSpacing = 10; // fester Abstand in px zwischen Buchstaben

    // Gesamtlänge berechnen: Summe aller Buchstabenbreiten + spacing dazwischen
    let totalWidth = 0;
    const letterWidths = [];
    for (let i = 0; i < title.length; i++) {
        const w = ctx.measureText(title[i]).width;
        letterWidths.push(w);
        totalWidth += w;
    }
    totalWidth += letterSpacing * (title.length - 1);

    // Startposition links vom Mittelpunkt
    let currentX = centerX - totalWidth / 2;

    // Einzelne Buchstaben zeichnen mit korrektem Abstand
    for (let i = 0; i < title.length; i++) {
        ctx.fillStyle = MenuState.titleColors[i];
        ctx.fillText(title[i], currentX, centerY - canvas.height * 0.1);
        currentX += letterWidths[i] + letterSpacing;
    }

    // === Anleitungstext darunter ===
    ctx.font = "bold 4vw sans-serif";
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.fillText("🡐 TRUE         FALSE 🡒", centerX, centerY + canvas.height * 0.1);

    // === Neue Zeile: Press Enter to start mit mehr Abstand ===
    ctx.font = "bold 3vw sans-serif";
    ctx.fillStyle = "#333";
    ctx.fillText("(Press Enter to start)", centerX, centerY + canvas.height * 0.18);
}
