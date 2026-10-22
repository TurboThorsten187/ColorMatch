import type { Challenge } from "@/core/challenge.ts";
import { type Color, wordFor } from "@/core/colors.ts";
import { ASSEMBLE_MARGIN, assembleRemaining, assembleStart } from "@/modifiers/assemble/look.ts";
import { fadeOpacity } from "@/modifiers/blink/look.ts";
import { blurPx } from "@/modifiers/blur/look.ts";
import type { Point, Size } from "@/modifiers/look.ts";
import { mirrorScale } from "@/modifiers/mirror/look.ts";
import { drift, MOVING_FONT_SCALE } from "@/modifiers/moving/look.ts";
import { AFTERIMAGE_OFFSET, afterimageOpacity } from "@/modifiers/negative/look.ts";
import { pulseFontScale, pulseRange, pulseScale } from "@/modifiers/pulsing/look.ts";
import { groupById } from "@/modifiers/registry.ts";
import { spin } from "@/modifiers/rotation/look.ts";
import { scramble, scrambleWords } from "@/modifiers/scrambled/look.ts";
import { shake, shakeFontScale, shakeReach, shakeTiltDeg } from "@/modifiers/shaky/look.ts";
import { SPAM_WORD } from "@/modifiers/spam/spam.ts";
import { DUO_OFFSET, DUO_SIZE, lineSeed } from "@/modifiers/twoWords/look.ts";
import type { ModifierGroupId, ModifierId, Sign } from "@/modifiers/types.ts";
import { type Font, WORD_FONT, WORD_WEIGHT } from "@/platform/fonts.ts";
import { fitScale, textWidth } from "./fitText.ts";
import { emWidth, flipLetters } from "./fontFlip.ts";

// The one way a challenge is drawn, in a level, the tutorial and on the intro cards: from the challenge and the time
// to the words, their letters, size and place. WordView.svelte puts the result on screen; the looks of the single
// modifiers are in the look.ts of their folders.

// How the word fills its box: the whole stage in a level, or the small example box of an intro card
export interface Layout {
    // Font size of a word as a share of the box height, but at least `minWordPx`, before it shrinks to fit the width
    // and the effects
    readonly wordHeight: number;
    readonly minWordPx: number;
    // Share of the box width the word may take up
    readonly wordWidth: number;
    // Share of the box height a moving word stays in
    readonly freeHeight: number;
    // A rotating word shrinks to fit the box in every direction, else the box cuts off what sticks out
    readonly turnRoom: boolean;
    // The rule signs above the word
    readonly signs: boolean;
    // Blur is set in px, a small box needs less
    readonly blurScale: number;
    // The colorblind background's shapes as small as those in the letters, else a small box shows a piece of one
    readonly smallBackground: boolean;
}

// A moving word stays out of the top bar and the TRUE / FALSE labels
export const STAGE: Layout = {
    wordHeight: 0.24,
    minWordPx: 0,
    wordWidth: 0.9,
    freeHeight: 0.62,
    turnRoom: true,
    signs: true,
    blurScale: 1,
    smallBackground: false,
};

// The card explains the rule signs in its text, and its rotating example may be cut off at the top and bottom
export const CARD: Layout = {
    wordHeight: 0.5,
    minWordPx: 40,
    wordWidth: 0.95,
    freeHeight: 1,
    turnRoom: false,
    signs: false,
    blurScale: 2 / 3,
    smallBackground: true,
};

export interface WordInput {
    readonly challenge: Challenge;
    // Time since the challenge appeared in ms
    readonly elapsed: number;
    // Assembling, WAIT and the negative's afterimage run on shares of the time limit
    readonly timeLimit: number;
    // The box the word is drawn in, its middle is the word's place
    readonly box: Size;
    readonly layout: Layout;
    // Presses so far in a SPAM! level, each one lights up a character
    readonly spamCount: number;
    // Shapes instead of colors: shape words, letters filled with shapes
    readonly colorblind: boolean;
    // The rule signs as last drawn, the word keeps room for them
    readonly signsSize: Size;
}

// One letter of a word that is drawn letter by letter
export interface Letter {
    readonly char: string;
    // FONT FLIP: the letter's own font and its size in em of the word's font size
    readonly font: Font | null;
    readonly size: number;
    // In px
    readonly width: number;
    // ASSEMBLE: how far the letter still is from its place, in px
    readonly x: number;
    readonly y: number;
    // SPAM!: not pressed yet
    readonly dim: boolean;
    // Moved or in its own font, so it stands on its own; SPAM! letters alone stay inline, kerned like the plain word
    readonly placed: boolean;
}

// One word on screen; DUO has two of them
export interface Line {
    readonly text: string;
    readonly color: Color;
    // Distance of the word's middle below the anchor, in px
    readonly offset: number;
    // Each word scrambles, flips and flies in its own way
    readonly seed: number;
    // FONT FLIP, ASSEMBLE and SPAM! draw the word letter by letter, else it is one text
    readonly letters: readonly Letter[] | null;
    // In px
    readonly width: number;
}

// The word's anchor transform: translate(x, y) rotate(rotation deg) scale(scaleX, scaleY)
export interface AnchorTransform extends Point {
    readonly rotation: number;
    readonly scaleX: number;
    readonly scaleY: number;
}

export interface WordFrame {
    readonly lines: readonly Line[];
    readonly fontSize: number;
    // The zero-size point in the box's middle that everything is drawn around, with all its transformations
    readonly anchor: AnchorTransform;
    // FADE fades the words and their signs, never the background
    readonly opacity: number;
    // The rule signs with their icons, and where their bottom is relative to the anchor
    readonly signs: readonly Sign[];
    readonly signsBottom: number;
    // BLURRED, in px
    readonly blur: number | null;
    // NEGATIVE: the opacity of the words' afterimage and where it lies
    readonly afterimage: number;
    readonly afterimageOffset: Point;
    // SYMMETRY draws every word twice, its left half and that half mirrored
    readonly splitMirror: boolean;
    // Letters filled with shapes; SPAM! is not about the color, its characters light up in plain ink
    readonly shapes: boolean;
}

// The part of a challenge that moves the word
export type Moved = Pick<Challenge, "modifiers" | "seed" | "tempo" | "strength">;

// A word's place and scale beside its rotation and mirrors
export interface WordMotion extends Point {
    readonly scale: number;
    // Degrees, from shaking
    readonly rotation: number;
}

// No text below 10 px, not even the zoomed word
const MIN_FONT_PX = 10;
// Distance from the word's middle to the bottom of its rule signs, in font sizes
const SIGN_GAP = 0.6;

export function wordFrame({
    challenge,
    elapsed,
    timeLimit,
    box,
    layout,
    spamCount,
    colorblind,
    signsSize,
}: WordInput): WordFrame {
    const has = (id: ModifierId): boolean => challenge.modifiers.has(id);
    // Animations play faster in later levels: the time each one has run, at its own tempo
    const played = (id: ModifierGroupId): number => elapsed * (challenge.tempo[id] ?? 1);
    const strengthOf = (id: ModifierGroupId): number => challenge.strength[id] ?? 0;

    // The words as they read, and as they show
    const words = [
        has("spam") ? SPAM_WORD : wordFor(challenge.word, colorblind),
        ...(challenge.second ? [wordFor(challenge.second.word, colorblind)] : []),
    ];
    const inks = [challenge.color, ...(challenge.second ? [challenge.second.color] : [])];
    const shown = words.map((text, index) =>
        has("scrambled") ? scramble(text, lineSeed(challenge.seed, index), played("scrambled")) : text,
    );
    // SCRAMBLED mixes the signs' text too
    const signs = layout.signs
        ? challenge.groups.flatMap((id) => {
              const sign = groupById(id).sign?.(elapsed / timeLimit);
              if (!sign) return [];
              return [
                  has("scrambled")
                      ? { ...sign, text: scrambleWords(sign.text, challenge.seed, played("scrambled")) }
                      : sign,
              ];
          })
        : [];

    // The size at which the word (or the wider of two) fits narrow or rotated screens, then smaller again to leave
    // room for the effects, and for ZOOM. Effects measured in px shrink with the zoom.
    // DUO's two words fit a low box's height too
    const fullSize = Math.min(
        Math.max(layout.minWordPx, box.height * layout.wordHeight) * (words.length > 1 ? DUO_SIZE : 1),
        box.height / (words.length > 1 ? 1 + 2 * DUO_OFFSET : 1),
    );
    const maxWidth =
        layout.wordWidth * (has("rotation") && layout.turnRoom ? Math.min(box.width, box.height) : box.width);
    const fitted =
        fullSize *
        fitScale(
            words.map((text) => ({ text, fontSize: fullSize })),
            maxWidth,
            WORD_FONT,
            WORD_WEIGHT,
        );
    const effectScale = effectFontScale(challenge);
    const sized = fitted * effectScale * challenge.size;
    const fontSize = challenge.size < 1 ? Math.max(MIN_FONT_PX, sized) : sized;
    const zoom = fontSize / (fitted * effectScale);
    // DUO: the upper word sits this far above the middle, the lower one as far below it
    const lineOffset = words.length > 1 ? fontSize * DUO_OFFSET : 0;

    // The words with their letters in place. A word is measured unscrambled, so that its moving room stays the same.
    const byLetter = has("fontFlip") || has("assemble") || has("spam");
    const placed = shown.map((text, index): Line => {
        const color = inks[index];
        const offset = index === 0 ? -lineOffset : lineOffset;
        const seed = lineSeed(challenge.seed, index);
        const wordWidth = textWidth({ text: words[index], fontSize }, WORD_FONT, WORD_WEIGHT);
        if (!byLetter) return { text, color, offset, seed, letters: null, width: wordWidth };
        // FONT FLIP keeps the proportions it has at the fitted size, whatever shrinks the word
        const shapes = has("fontFlip")
            ? flipLetters(
                  text,
                  seed,
                  played("fontFlip"),
                  fullSize / fitted,
                  maxWidth / fitted,
                  strengthOf("fontFlip"),
                  colorblind,
              ).map((letter) => ({ ...letter, width: letter.size * emWidth(letter.char, letter.font) * fontSize }))
            : [...text].map((char) => ({
                  char,
                  font: null,
                  size: 1,
                  width: textWidth({ text: char, fontSize }, WORD_FONT, WORD_WEIGHT),
              }));
        const letters = shapes.map((shape, letter) => ({
            ...shape,
            x: 0,
            y: 0,
            dim: has("spam") && letter >= spamCount,
            placed: shape.font !== null || has("assemble"),
        }));
        // Letters that are placed one by one are not kerned, plain SPAM! letters are
        const apart = has("fontFlip") || has("assemble");
        const width = apart ? letters.reduce((sum, letter) => sum + letter.width, 0) : wordWidth;
        return { text, color, offset, seed, letters, width };
    });

    // Space the word takes up, a rotated word may point in any direction and a shaking one tilts a little. The rule
    // signs move with it: above it, or below when it is mirrored upside down, and around it when it rotates.
    const wordWidth = Math.max(...placed.map((line) => line.width));
    const tilt = has("shaky") ? wordWidth * Math.sin((shakeTiltDeg(strengthOf("shaky")) * Math.PI) / 180) : 0;
    let extent: Size = has("rotation")
        ? { width: wordWidth, height: wordWidth }
        : { width: wordWidth, height: fontSize + 2 * lineOffset + tilt };
    if (signs.length > 0) {
        const reach = lineOffset + fontSize * SIGN_GAP + signsSize.height;
        const turning = has("rotation") ? 2 * Math.hypot(reach, signsSize.width / 2) : 0;
        extent = {
            width: Math.max(extent.width, signsSize.width, turning),
            height: Math.max(extent.height, 2 * reach, turning),
        };
    }

    const area = { width: box.width, height: box.height * layout.freeHeight };
    const { x, y, scale, rotation } = wordMotion(challenge, elapsed, area, extent, zoom);
    const mirror = mirrorScale(challenge.modifiers);
    const anchor: AnchorTransform = {
        x,
        y,
        rotation:
            rotation +
            (has("rotation")
                ? challenge.rotationDeg + spin(challenge.seed, played("rotation"), strengthOf("rotation"))
                : 0),
        scaleX: mirror.x * scale,
        scaleY: mirror.y * scale,
    };

    // ASSEMBLE: every letter flies in from its own point outside the box to its place in the word. The points are on
    // the box's edges whatever the word does, so they are taken back through the anchor's transform.
    const lines = has("assemble")
        ? placed.map((line): Line => {
              let left = -line.width / 2;
              const letters = line.letters?.map((letter, index) => {
                  const place = { x: left + letter.width / 2, y: line.offset };
                  left += letter.width;
                  const edge = assembleStart(line.seed, index, box, fontSize * ASSEMBLE_MARGIN);
                  const start = toAnchor(edge, anchor);
                  const remaining = assembleRemaining(line.seed, index, elapsed, timeLimit);
                  return { ...letter, x: (start.x - place.x) * remaining, y: (start.y - place.y) * remaining };
              });
              return { ...line, letters: letters ?? null };
          })
        : placed;

    return {
        lines,
        fontSize,
        anchor,
        opacity: has("blink") ? fadeOpacity(played("blink")) : 1,
        signs,
        signsBottom: -(lineOffset + fontSize * SIGN_GAP),
        blur: has("blur") ? blurPx(strengthOf("blur")) * layout.blurScale : null,
        afterimage: has("negative") ? afterimageOpacity(elapsed, timeLimit) : 0,
        afterimageOffset: { x: AFTERIMAGE_OFFSET.x * zoom, y: AFTERIMAGE_OFFSET.y * zoom },
        splitMirror: has("splitMirror"),
        shapes: colorblind && !has("spam"),
    };
}

// Font size factor that keeps the moved, shaken or grown word on screen
export function effectFontScale({ modifiers, strength }: Pick<Challenge, "modifiers" | "strength">): number {
    return (
        (modifiers.has("moving") ? MOVING_FONT_SCALE : 1) *
        (modifiers.has("shaky") ? shakeFontScale(strength.shaky ?? 0) : 1) *
        (modifiers.has("pulsing") ? pulseFontScale(strength.pulsing ?? 0) : 1)
    );
}

// Offset and scale of the word inside `area`, the free rectangle around the box's middle. `word` is the space the
// word takes up at scale 1, `size` the zoomed word's size relative to normal.
export function wordMotion(
    { modifiers, seed, tempo, strength }: Moved,
    elapsed: number,
    area: Size,
    word: Size,
    size = 1,
): WordMotion {
    const reach = modifiers.has("shaky") ? shakeReach(area, strength.shaky ?? 0, size) : { x: 0, y: 0 };
    let x = 0;
    let y = 0;
    let rotation = 0;
    if (modifiers.has("moving")) {
        // A shaking word keeps the shake's reach as extra distance, or it leaves the box at the turning points
        const grown = modifiers.has("pulsing") ? pulseRange(strength.pulsing ?? 0).high : 1;
        const grownWord = { width: word.width * grown, height: word.height * grown };
        const drifted = drift(seed, elapsed * (tempo.moving ?? 1), area, grownWord, reach);
        x += drifted.x;
        y += drifted.y;
    }
    if (modifiers.has("shaky")) {
        const shaken = shake(seed, elapsed * (tempo.shaky ?? 1), reach, strength.shaky ?? 0);
        x += shaken.x;
        y += shaken.y;
        rotation = shaken.rotation;
    }
    const scale = modifiers.has("pulsing")
        ? pulseScale(seed, elapsed * (tempo.pulsing ?? 1), strength.pulsing ?? 0)
        : 1;
    return { x, y, scale, rotation };
}

// A point given relative to the anchor's untransformed position (the box's middle) in the anchor's own coordinates,
// so that something placed there inside the transformed anchor shows at that point on screen
export function toAnchor(point: Point, anchor: AnchorTransform): Point {
    const radians = (anchor.rotation * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const dx = point.x - anchor.x;
    const dy = point.y - anchor.y;
    return {
        x: (dx * cos + dy * sin) / anchor.scaleX,
        y: (-dx * sin + dy * cos) / anchor.scaleY,
    };
}
