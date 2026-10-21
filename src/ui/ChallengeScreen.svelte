<script lang="ts">
    import type { Challenge } from "../game/challenge.ts";
    import { type Color, wordFor } from "../game/colors.ts";
    import { SPAM_WORD, WAIT_SHARE } from "../game/game.ts";
    import type { ModifierGroupId, ModifierId } from "../game/modifiers.ts";
    import { NOW_SIGN, SIGN_CSS, SIGNS, SPAM_COLOR } from "../game/signs.ts";
    import {
        type AnchorTransform,
        afterimageOpacity,
        assembleRemaining,
        assembleStart,
        effectFontScale,
        fadeOpacity,
        scramble,
        scrambleWords,
        shakeTiltDeg,
        spin,
        toAnchor,
        wordMotion,
    } from "./effects.ts";
    import { fitScale, textWidth } from "./fitText.ts";
    import { emWidth, flipLetters } from "./fontFlip.ts";
    import { type Font, WORD_FONT, WORD_WEIGHT } from "./fonts.ts";
    import { backgroundStyle, inkStyle } from "./shapes.ts";
    import SplitMirror from "./SplitMirror.svelte";

    interface Props {
        challenge: Challenge;
        // Time since the challenge appeared in ms
        elapsed: number;
        // The level's time limit in ms: assembling, WAIT and the negative's afterimage run on shares of it
        timeLimit: number;
        width: number;
        height: number;
        // Presses so far in a SPAM! level, each one lights up a character
        spamCount?: number;
        // The loss animation replaces the word with its falling pixels
        hideWord?: boolean;
        // The point the word is drawn around, with all its transformations
        anchor?: HTMLElement;
        // Shapes instead of colors: shape words, letters filled with shapes
        colorblind?: boolean;
    }

    // One letter of a word that is drawn letter by letter
    interface Letter {
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
    }

    // One word on screen; TWO WORDS has two of them
    interface Line {
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

    let {
        challenge,
        elapsed,
        timeLimit,
        width,
        height,
        spamCount = 0,
        hideWord = false,
        anchor = $bindable(),
        colorblind = false,
    }: Props = $props();

    const SPAM_DIM = "#3a3a3a";
    // Moving words stay out of the top bar and the TRUE / FALSE labels
    const FREE_HEIGHT_SHARE = 0.62;
    // Distance from the word's center to the bottom of its rule tags, in font sizes
    const TAG_GAP = 0.6;
    // BLURRED grows from BLUR_GENTLE_PX to BLUR_STRONG_PX with its strength. The small tags would vanish with that,
    // they get about the same share of their size.
    const BLUR_GENTLE_PX = 6;
    const BLUR_STRONG_PX = 9;
    const TAG_BLUR_EM_PER_PX = 0.014;
    const WORD_HEIGHT_SHARE = 0.24;
    const WORD_WIDTH_SHARE = 0.9;
    // TWO WORDS: both words get this share of the normal size and sit this many font sizes above and below the middle
    const TWO_WORDS_SIZE = 0.8;
    const TWO_WORDS_OFFSET = 0.75;
    // No text below 10 px, not even the zoomed word
    const MIN_FONT_PX = 10;
    // Assembling letters start this many font sizes outside the screen
    const ASSEMBLE_MARGIN = 0.5;
    // NEGATIVE: where the afterimage lies behind the word
    const AFTERIMAGE_X_PX = 12;
    const AFTERIMAGE_Y_PX = 8;
    // Shifts the seed for the lower of two words
    const LINE_SEED_STEP = 0.29;

    const has = (id: ModifierId): boolean => challenge.modifiers.has(id);

    // Animations play faster in later levels: the time each one has run, at its own tempo
    const played = (id: ModifierGroupId): number => elapsed * (challenge.tempo[id] ?? 1);

    const lineSeed = (index: number): number => (challenge.seed + LINE_SEED_STEP * index) % 1;

    const strengthOf = (id: ModifierGroupId): number => challenge.strength[id] ?? 0;
    const blurPx = $derived(BLUR_GENTLE_PX + (BLUR_STRONG_PX - BLUR_GENTLE_PX) * strengthOf("blur"));

    const opacity = $derived(has("blink") ? fadeOpacity(played("blink")) : 1);
    const words = $derived([
        has("spam") ? SPAM_WORD : wordFor(challenge.word, colorblind),
        ...(challenge.second ? [wordFor(challenge.second.word, colorblind)] : []),
    ]);
    const inks = $derived(
        has("spam") ? [SPAM_COLOR] : [challenge.color, ...(challenge.second ? [challenge.second.color] : [])],
    );
    const shownWords = $derived(
        words.map((text, index) => (has("scrambled") ? scramble(text, lineSeed(index), played("scrambled")) : text)),
    );
    // The rule signs, each in its rule's color
    const tags = $derived(
        [
            ...(has("noClick") ? [SIGNS.noClick] : []),
            ...(has("invertInput") ? [SIGNS.invertInput] : []),
            ...(has("wait") ? [elapsed < timeLimit * WAIT_SHARE ? SIGNS.wait : NOW_SIGN] : []),
            ...(has("doubleTap") ? [SIGNS.doubleTap] : []),
            ...(has("twoWords") ? [SIGNS.twoWords] : []),
        ].map((sign) =>
            has("scrambled") ? { ...sign, text: scrambleWords(sign.text, challenge.seed, played("scrambled")) } : sign,
        ),
    );
    const byLetter = $derived(has("fontFlip") || has("assemble") || has("spam"));
    let tagsWidth = $state(0);
    let tagsHeight = $state(0);

    const fullSize = $derived(height * WORD_HEIGHT_SHARE * (words.length > 1 ? TWO_WORDS_SIZE : 1));
    const maxWidth = $derived(WORD_WIDTH_SHARE * (has("rotation") ? Math.min(width, height) : width));
    // The size at which the word (or the wider of two) fits narrow or rotated screens, before the effects shrink it
    const fitted = $derived(
        fullSize *
            fitScale(
                words.map((text) => ({ text, fontSize: fullSize })),
                maxWidth,
                WORD_FONT,
                WORD_WEIGHT,
            ),
    );
    // Smaller again to leave room for the effects, and for ZOOM
    const fontSize = $derived.by(() => {
        const size = fitted * effectFontScale(challenge.modifiers, challenge.strength) * challenge.size;
        return challenge.size < 1 ? Math.max(MIN_FONT_PX, size) : size;
    });
    // ZOOM: the word's size relative to normal. Effects measured in px shrink with it.
    const zoom = $derived(fontSize / (fitted * effectFontScale(challenge.modifiers, challenge.strength)));
    // TWO WORDS: the upper word sits this far above the middle, the lower one as far below it
    const lineOffset = $derived(words.length > 1 ? fontSize * TWO_WORDS_OFFSET : 0);

    // The words with their letters in place. A word is measured unscrambled, so that its moving room stays the same.
    const placedLines = $derived(
        shownWords.map((text, index): Line => {
            const color = inks[index];
            const offset = index === 0 ? -lineOffset : lineOffset;
            const seed = lineSeed(index);
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
                  ).map((letter) => ({
                      ...letter,
                      width: letter.size * emWidth(letter.char, letter.font) * fontSize,
                  }))
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
            }));
            // Letters that are placed one by one are not kerned, plain SPAM! letters are
            const placed = has("fontFlip") || has("assemble");
            const lineWidth = placed ? letters.reduce((sum, letter) => sum + letter.width, 0) : wordWidth;
            return { text, color, offset, seed, letters, width: lineWidth };
        }),
    );

    // Space the word takes up, a rotated word may point in any direction and a shaking one tilts a little. The rule
    // tags move with it: above it, or below when it is mirrored upside down, and around it when it rotates.
    const extent = $derived.by(() => {
        const wordWidth = Math.max(...placedLines.map((line) => line.width));
        const tilt = has("shaky") ? wordWidth * Math.sin((shakeTiltDeg(strengthOf("shaky")) * Math.PI) / 180) : 0;
        const alone = has("rotation")
            ? { width: wordWidth, height: wordWidth }
            : { width: wordWidth, height: fontSize + 2 * lineOffset + tilt };
        if (tags.length === 0) return alone;
        const reach = lineOffset + fontSize * TAG_GAP + tagsHeight;
        const turning = has("rotation") ? 2 * Math.hypot(reach, tagsWidth / 2) : 0;
        return {
            width: Math.max(alone.width, tagsWidth, turning),
            height: Math.max(alone.height, 2 * reach, turning),
        };
    });

    const motion = $derived.by((): AnchorTransform => {
        const area = { width, height: height * FREE_HEIGHT_SHARE };
        const { x, y, scale, rotation } = wordMotion(
            challenge.modifiers,
            challenge.seed,
            elapsed,
            area,
            extent,
            challenge.tempo,
            zoom,
            challenge.strength,
        );
        const mirrorX = has("mirrorHorizontal") || has("mirrorBoth") ? -1 : 1;
        const mirrorY = has("mirrorVertical") || has("mirrorBoth") ? -1 : 1;
        return {
            x,
            y,
            rotation:
                rotation +
                (has("rotation")
                    ? challenge.rotationDeg + spin(challenge.seed, played("rotation"), strengthOf("rotation"))
                    : 0),
            scaleX: mirrorX * scale,
            scaleY: mirrorY * scale,
        };
    });
    const transform = $derived(
        `translate(${motion.x}px, ${motion.y}px) rotate(${motion.rotation}deg) scale(${motion.scaleX}, ${motion.scaleY})`,
    );

    // ASSEMBLE: every letter flies in from its own point outside the screen to its place in the word. The points are
    // on the screen's edges whatever the word does, so they are taken back through the anchor's transform.
    const lines = $derived(
        has("assemble")
            ? placedLines.map((line): Line => {
                  let left = -line.width / 2;
                  const letters = line.letters?.map((letter, index) => {
                      const place = { x: left + letter.width / 2, y: line.offset };
                      left += letter.width;
                      const edge = assembleStart(line.seed, index, { width, height }, fontSize * ASSEMBLE_MARGIN);
                      const start = toAnchor(edge, motion);
                      const remaining = assembleRemaining(line.seed, index, elapsed, timeLimit);
                      return { ...letter, x: (start.x - place.x) * remaining, y: (start.y - place.y) * remaining };
                  });
                  return { ...line, letters: letters ?? null };
              })
            : placedLines,
    );

    const afterimage = $derived(has("negative") ? afterimageOpacity(elapsed, timeLimit) : 0);
</script>

{#snippet content(line: Line)}
    {#if line.letters}
        {#each line.letters as letter, index (index)}
            <span
                class="letter"
                class:placed={letter.font || has("assemble")}
                data-ink={line.color}
                style={letter.dim ? `color: ${SPAM_DIM}` : inkStyle(line.color, colorblind && !has("spam"))}
                style:font-family={letter.font?.family}
                style:font-weight={letter.font?.weight}
                style:font-size={letter.font ? `${letter.size}em` : null}
                style:transform={letter.x || letter.y ? `translate(${letter.x}px, ${letter.y}px)` : null}
                >{letter.char}</span
            >
        {/each}
    {:else}
        {line.text}
    {/if}
{/snippet}

<!-- The loss animation draws every piece with data-ink in its ink: the word, or each of its letters or halves -->
{#snippet wordLine(line: Line)}
    {@const ink = line.letters || has("splitMirror") ? null : line.color}
    <div
        class="word"
        data-ink={ink}
        style={ink ? inkStyle(ink, colorblind) : null}
        style:transform="translate(-50%, calc(-50% + {line.offset}px))"
        style:filter={has("blur") ? `blur(${blurPx * zoom}px)` : null}
    >
        {#if has("splitMirror")}
            <SplitMirror ink={line.letters ? null : line.color} {colorblind}>{@render content(line)}</SplitMirror>
        {:else}
            {@render content(line)}
        {/if}
    </div>
{/snippet}

<div
    class="screen"
    style:background={challenge.background ? backgroundStyle(challenge.background, colorblind) : "#000"}
>
    <!-- Blink only fades the word and its rule tags, the background stays. The tags get every effect of the word. -->
    {#if opacity > 0}
        <div bind:this={anchor} class="anchor" style:transform style:opacity={opacity < 1 ? opacity : null}>
            {#if !hideWord}
                <!-- The words come first: the loss animation reads them as the anchor's first child -->
                <div class="lines" style:font-size="{fontSize}px">
                    {#each lines as line, index (index)}
                        {@render wordLine(line)}
                    {/each}
                </div>
                {#if afterimage > 0}
                    <!-- NEGATIVE: the words in their negative colors, behind them -->
                    <div
                        class="lines afterimage"
                        style:font-size="{fontSize}px"
                        style:opacity={afterimage}
                        style:transform="translate({AFTERIMAGE_X_PX * zoom}px, {AFTERIMAGE_Y_PX * zoom}px)"
                    >
                        {#each lines as line, index (index)}
                            {@render wordLine(line)}
                        {/each}
                    </div>
                {/if}
            {/if}
            {#if tags.length > 0}
                <div
                    class="tags"
                    style:top="{-(lineOffset + fontSize * TAG_GAP)}px"
                    bind:clientWidth={tagsWidth}
                    bind:clientHeight={tagsHeight}
                >
                    {#each tags as tag, index (index)}
                        <span
                            class="tag"
                            style:background={SIGN_CSS[tag.color]}
                            style:filter={has("blur") ? `blur(${TAG_BLUR_EM_PER_PX * blurPx}em)` : null}
                            >{tag.text}</span
                        >
                    {/each}
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .screen {
        position: absolute;
        inset: 0;
    }

    .tags {
        position: absolute;
        left: 0;
        transform: translate(-50%, -100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
    }

    /* The background is the rule's color */
    .tag {
        padding: 8px 10px;
        color: #000;
        font-size: max(11px, calc(1.5 * var(--unit)));
        white-space: nowrap;
    }

    /* Zero-size point in the center that all transformations pivot around */
    .anchor {
        position: absolute;
        left: 50%;
        top: 50%;
    }

    /* Zero-size like the anchor, the words are placed around it */
    .lines {
        position: absolute;
    }

    .word {
        position: absolute;
        font-family: Orbitron, sans-serif;
        font-weight: 900;
        line-height: 1;
        white-space: nowrap;
    }

    /* Moved or in its own font; SPAM! letters alone stay inline, kerned like the plain word */
    .placed {
        display: inline-block;
    }

    .afterimage {
        z-index: -1;
        filter: invert(1);
    }
</style>
