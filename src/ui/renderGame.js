import { GameLoopStateInstance as GLS } from "../game/gameLoopState.js";

export function renderGame() {
    let output = `Aktuelles Level: ${GLS.currentLevel}\n`;

    // Aktive Modifier
    if (GLS.activeModifiers && GLS.activeModifiers.length > 0) {
        output += "Aktive Modifier:\n";
        GLS.activeModifiers.forEach((modifier, idx) => {
            output += `  ${idx + 1}. Name: ${modifier.name}\n`;
        });
    } else {
        output += "Keine aktiven Modifier.\n";
    }

    // Farbe und Text
    output += `Farbe: ${GLS.currentChallenge.color}\n`;
    output += `Text: ${GLS.currentChallenge.text}`;

    console.log(output);
}