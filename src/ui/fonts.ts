import "@fontsource/orbitron/latin-900.css";
import "@fontsource/press-start-2p/latin-400.css";

export const UI_FONT = '"Press Start 2P"';
export const WORD_FONT = "Orbitron";
export const WORD_WEIGHT = 900;

// Text fitting measures glyph widths, so the real fonts have to be loaded before the first frame
export async function loadFonts(): Promise<void> {
    try {
        await Promise.all([
            document.fonts.load(`${WORD_WEIGHT} 1em ${WORD_FONT}`),
            document.fonts.load(`1em ${UI_FONT}`),
        ]);
    } catch {
        // The game still works with fallback fonts, the text fitting is just less exact
    }
}
