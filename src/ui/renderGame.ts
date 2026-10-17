import { ctx, viewport } from "./canvasSetup.ts";
import { fitText } from "./fitText.ts";
import { GameLoopStateInstance as GLS } from "../game/gameLoopState.ts";
import { InputType } from "../game/challenge.ts";
import { COLOR_LIST } from "../game/colors.ts";
import { hasModifier, type ModifierName } from "../modifiers/modifiers.ts";

export function renderGame(): void {
    const challenge = GLS.currentChallenge;
    if (!challenge) return;

    const has = (name: ModifierName) => hasModifier(GLS.activeModifiers, name);
    const { width, height } = viewport;

    // === Zeit- oder Zustand-basierte Modifier (z. B. Blink) ===
    if (has("BlinkModifier") && Date.now() - GLS.decisionStartTime > 500) {
        ctx.clearRect(0, 0, width, height);
        return;
    }

    // === Hintergrund setzen ===
    let bgColor = "white";
    if (has("BackgroundColorModifier")) {
        if (challenge.correctInput === InputType.FALSE && !has("InvertInputModifier")) {
            bgColor = challenge.text;
        } else {
            const otherColors = COLOR_LIST.filter(c => c !== challenge.color);
            const seed = (GLS.currentLevel * 31 + 7) % otherColors.length;
            bgColor = otherColors[seed];
        }
    }
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // === Transformation vorbereiten (Save Zustand) ===
    ctx.save();
    ctx.translate(width / 2, height / 2);

    // RotationModifier (Winkel von -90 bis +90 Grad, levelabhängig)
    const rotated = has("RotationModifier");
    if (rotated) {
        const seed = (GLS.currentLevel * 53 + 19) % 181; // Werte 0 bis 180
        const angle = (seed - 90) * Math.PI / 180;      // -90 bis +90 Grad in Radianten
        ctx.rotate(angle);
    }

    // Horizontal- und Vertikalspiegelung
    if (has("HorizontalMirrorModifier")) {
        ctx.scale(-1, 1);
    }
    if (has("VerticalMirrorModifier")) {
        ctx.scale(1, -1);
    }

    // === Text vorbereiten ===
    const mainText = has("SpamClickModifier") ? "Spam!" : capitalizeFirstLetter(challenge.text);

    const subTextsBelow: string[] = [];
    if (has("NoClickModifier")) {
        subTextsBelow.push("Don't Click!");
    }
    if (has("InvertInputModifier")) {
        subTextsBelow.push("Inverted Input!");
    }

    const subTextsAbove: string[] = [];
    if (has("InvertColorsModifier")) {
        subTextsAbove.push("Inverted Colors!");
    }

    // === Schriftgrößen relativ zur Höhe, bei schmalen Fenstern an die Breite angepasst ===
    let mainFontSize = height * 0.24;
    let subFontSize = height * 0.12;
    const fit = fitText(
        [
            { text: mainText, fontSize: mainFontSize },
            ...[...subTextsAbove, ...subTextsBelow].map(text => ({ text, fontSize: subFontSize })),
        ],
        0.9 * (rotated ? Math.min(width, height) : width),
    );
    mainFontSize *= fit;
    subFontSize *= fit;
    const subTextSpacing = subFontSize * 1.25; // Abstand zwischen Subtextzeilen

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = challenge.color;

    // === Blurred Modifier ===
    ctx.filter = has("BlurredModifier") ? "blur(10px)" : "none";

    // Subtexts above (über Haupttext)
    ctx.font = `bold ${subFontSize}px sans-serif`;
    subTextsAbove.forEach((text, i) => {
        ctx.fillText(text, 0, -mainFontSize - i * subTextSpacing);
    });

    // Haupttext
    ctx.font = `bold ${mainFontSize}px sans-serif`;
    ctx.fillText(mainText, 0, 0);

    // Subtexts below (unter Haupttext)
    ctx.font = `bold ${subFontSize}px sans-serif`;
    subTextsBelow.forEach((text, i) => {
        ctx.fillText(text, 0, mainFontSize + i * subTextSpacing);
    });

    // === Filter + Transformation zurücksetzen ===
    ctx.restore();

    // === InvertColorsModifier zum Schluss über den Canvas legen ===
    // "difference" mit Weiß invertiert jeden Pixel, ohne die Pixeldaten pro Frame auszulesen
    if (has("InvertColorsModifier")) {
        ctx.globalCompositeOperation = "difference";
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = "source-over";
    }
}

function capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
