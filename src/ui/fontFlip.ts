import { flipFont } from "./effects.ts";
import { textWidth } from "./fitText.ts";
import { FLIP_FONTS, type Font } from "./fonts.ts";

export interface FlipLetter {
    readonly char: string;
    readonly font: Font;
    // Font size in em of the word's font size
    readonly size: number;
}

const MEASURE_PX = 100;
// How often a wild font comes compared to a readable one, from strength 0 to 1: 1.5 times as often at full strength
const WILD_WEIGHT_GENTLE = 0.5;
const WILD_WEIGHT_STRONG = 0.75;

// FONT FLIP: every letter in its own font, as large as the whole word would be in that font so that it fits, at most
// `maxSize`. If the letters then add up to more than `maxWidth`, all of them shrink together. Both are in em. The
// stronger the modifier, the more often the wild fonts come. `colorblind` keeps to the thick fonts.
export function flipLetters(
    text: string,
    seed: number,
    elapsed: number,
    maxSize: number,
    maxWidth: number,
    strength = 0,
    colorblind = false,
): FlipLetter[] {
    const wild = WILD_WEIGHT_GENTLE + (WILD_WEIGHT_STRONG - WILD_WEIGHT_GENTLE) * strength;
    const fonts = colorblind ? FLIP_FONTS.filter((font) => font.thick) : FLIP_FONTS;
    const weights = fonts.map((font) => (font.wild ? wild : 1));
    const letters = [...text].map((char, index) => {
        const font = fonts[flipFont(seed, index, elapsed, weights)];
        return { char, font, size: Math.min(maxSize, maxWidth / emWidth(text, font)) };
    });
    const total = letters.reduce((sum, letter) => sum + letter.size * emWidth(letter.char, letter.font), 0);
    const shrink = total > maxWidth ? maxWidth / total : 1;
    return letters.map((letter) => ({ ...letter, size: letter.size * shrink }));
}

// Width of `text` in em
export function emWidth(text: string, font: Font): number {
    return textWidth({ text, fontSize: MEASURE_PX }, font.family, font.weight) / MEASURE_PX;
}
