import { canvas, ctx } from "./canvasSetup.js";
import { GameLoopStateInstance as GLS } from "../game/gameLoopState.js";
import { InputType } from "../game/challenge.js";
import { Colors } from "../game/gameLoop.js";

export function renderGame() {
    const challenge = GLS.currentChallenge;
    const modifiers = GLS.activeModifiers ?? [];

    console.log("Aktive Modifier:", modifiers.map(m => m.name));

    // === Zeit- oder Zustand-basierte Modifier (z. B. Blink) ===
    if (modifiers.some(m => m.name === "BlinkModifier")) {
        const now = Date.now();
        if (now - GLS.decisionStartTime > 500) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
    }

    // === Hintergrund setzen ===
    let bgColor = "white";
    const bgMod = modifiers.find(m => m.name === "BackgroundColorModifier");
    if (bgMod) {
        if ((challenge.correctInput === InputType.FALSE) && !(modifiers.find(m => m.name === "InvertInputModifier"))) {
            bgColor = challenge.text;
        } else {
            const otherColors = Object.values(Colors).filter(c => c !== challenge.color);
            const seed = (GLS.currentLevel * 31 + 7) % otherColors.length;
            bgColor = otherColors[seed];
        }
    }
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // === Transformation vorbereiten (Save Zustand) ===
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);

    // RotationModifier (Winkel von -90 bis +90 Grad, levelabhängig)
    if (modifiers.some(m => m.name === "RotationModifier")) {
        const seed = (GLS.currentLevel * 53 + 19) % 181; // Werte 0 bis 180
        const angle = (seed - 90) * Math.PI / 180;      // -90 bis +90 Grad in Radianten
        ctx.rotate(angle);
    }

    // Horizontal- und Vertikalspiegelung
    if (modifiers.some(m => m.name === "HorizontalMirrorModifier")) {
        ctx.scale(-1, 1);
    }
    if (modifiers.some(m => m.name === "VerticalMirrorModifier")) {
        ctx.scale(1, -1);
    }

    // === Skalierung für Schriftgrößen relativ zur Canvas-Höhe ===
    const baseHeight = 800;
    const scale = (canvas.height / baseHeight) * 3;

    const mainFontSize = 64 * scale;
    const subFontSize = 32 * scale;
    const subTextSpacing = subFontSize + 8 * scale; // Abstand zwischen Subtextzeilen

    // === Text vorbereiten ===
    let mainText = challenge.text;
    const subTextsBelow = [];

    if (modifiers.some(m => m.name === "SpamClickModifier")) {
        mainText = "Spam!";
    } else {
        mainText = capitalizeFirstLetter(mainText);
    }

    if (modifiers.some(m => m.name === "NoClickModifier")) {
        subTextsBelow.push("Don't Click!");
    }
    if (modifiers.some(m => m.name === "InvertInputModifier")) {
        subTextsBelow.push("Inverted Input!");
    }

    const subTextsAbove = [];
    if (modifiers.some(m => m.name === "InvertColorsModifier")) {
        subTextsAbove.push("Inverted Colors!");
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // === Blurred Modifier ===
    ctx.filter = modifiers.some(m => m.name === "BlurredModifier") ? "blur(5px)" : "none";

    // Subtexts above (über Haupttext)
    ctx.font = `bold ${subFontSize}px sans-serif`;
    ctx.fillStyle = challenge.color;
    subTextsAbove.forEach((text, i) => {
        ctx.fillText(text, 0, -mainFontSize - i * subTextSpacing);
    });

    // Haupttext
    ctx.font = `bold ${mainFontSize}px sans-serif`;
    ctx.fillStyle = challenge.color;
    ctx.fillText(mainText, 0, 0);

    // Subtexts below (unter Haupttext)
    ctx.font = `bold ${subFontSize}px sans-serif`;
    ctx.fillStyle = challenge.color;
    subTextsBelow.forEach((text, i) => {
        ctx.fillText(text, 0, mainFontSize + i * subTextSpacing);
    });

    // === Reset Filter + Transformation ===
    ctx.filter = "none";
    ctx.restore();

    // === InvertColorsModifier zum Schluss über den Canvas legen ===
    if (modifiers.some(m => m.name === "InvertColorsModifier")) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i]     = 255 - data[i];     // R
            data[i + 1] = 255 - data[i + 1]; // G
            data[i + 2] = 255 - data[i + 2]; // B
        }
        ctx.putImageData(imageData, 0, 0);
    }
}

function capitalizeFirstLetter(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

