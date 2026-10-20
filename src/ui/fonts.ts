import "@fontsource/orbitron/latin-900.css";
import "@fontsource/press-start-2p/latin-400.css";
// The fonts of the FONT FLIP modifier; their files only download once loadFlipFonts asks for them
import "@fontsource/bungee/latin-400.css";
import "@fontsource/monoton/latin-400.css";
import "@fontsource/creepster/latin-400.css";
import "@fontsource/pacifico/latin-400.css";
import "@fontsource/lobster/latin-400.css";
import "@fontsource/bebas-neue/latin-400.css";
import "@fontsource/abril-fatface/latin-400.css";
import "@fontsource/black-ops-one/latin-400.css";
import "@fontsource/permanent-marker/latin-400.css";
import "@fontsource/rubik-mono-one/latin-400.css";
import "@fontsource/silkscreen/latin-400.css";
import "@fontsource/unifrakturmaguntia/latin-400.css";
import "@fontsource/shrikhand/latin-400.css";
import "@fontsource/nosifer/latin-400.css";
import "@fontsource/bungee-shade/latin-400.css";
import "@fontsource/vt323/latin-400.css";
import "@fontsource/major-mono-display/latin-400.css";
import "@fontsource/codystar/latin-400.css";
import "@fontsource/faster-one/latin-400.css";
import "@fontsource/ewert/latin-400.css";
import "@fontsource/wallpoet/latin-400.css";
import "@fontsource/audiowide/latin-400.css";
import "@fontsource/special-elite/latin-400.css";
import "@fontsource/bangers/latin-400.css";
import "@fontsource/fredericka-the-great/latin-400.css";
import "@fontsource/megrim/latin-400.css";

export const UI_FONT = '"Press Start 2P"';
export const WORD_FONT = "Orbitron";
export const WORD_WEIGHT = 900;

export interface Font {
    // A CSS font family, quoted where the name needs it
    readonly family: string;
    readonly weight: number;
}

// FONT FLIP switches every letter between these
export const FLIP_FONTS: readonly Font[] = [
    { family: WORD_FONT, weight: WORD_WEIGHT },
    { family: UI_FONT, weight: 400 },
    { family: '"Bungee"', weight: 400 },
    { family: '"Monoton"', weight: 400 },
    { family: '"Creepster"', weight: 400 },
    { family: '"Pacifico"', weight: 400 },
    { family: '"Lobster"', weight: 400 },
    { family: '"Bebas Neue"', weight: 400 },
    { family: '"Abril Fatface"', weight: 400 },
    { family: '"Black Ops One"', weight: 400 },
    { family: '"Permanent Marker"', weight: 400 },
    { family: '"Rubik Mono One"', weight: 400 },
    { family: '"Silkscreen"', weight: 400 },
    { family: '"UnifrakturMaguntia"', weight: 400 },
    { family: '"Shrikhand"', weight: 400 },
    { family: '"Nosifer"', weight: 400 },
    { family: '"Bungee Shade"', weight: 400 },
    { family: '"VT323"', weight: 400 },
    { family: '"Major Mono Display"', weight: 400 },
    { family: '"Codystar"', weight: 400 },
    { family: '"Faster One"', weight: 400 },
    { family: '"Ewert"', weight: 400 },
    { family: '"Wallpoet"', weight: 400 },
    { family: '"Audiowide"', weight: 400 },
    { family: '"Special Elite"', weight: 400 },
    { family: '"Bangers"', weight: 400 },
    { family: '"Fredericka the Great"', weight: 400 },
    { family: '"Megrim"', weight: 400 },
];

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

// FONT FLIP comes several levels into a game, so its fonts load in the background meanwhile
export async function loadFlipFonts(): Promise<void> {
    try {
        await Promise.all(FLIP_FONTS.map((font) => document.fonts.load(`${font.weight} 1em ${font.family}`)));
    } catch {
        // A font that does not load is replaced by a fallback font, FONT FLIP still works
    }
}
