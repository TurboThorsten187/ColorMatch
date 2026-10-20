<script lang="ts">
    import type { Challenge } from "../game/challenge.ts";
    import { type Color, wordFor } from "../game/colors.ts";
    import { SPAM_WORD, WAIT_SHARE } from "../game/game.ts";
    import type { ModifierGroupId, ModifierId } from "../game/modifiers.ts";
    import {
        afterimageOpacity,
        assembleRemaining,
        assembleStart,
        effectFontScale,
        fadeOpacity,
        scramble,
        scrambleWords,
        SHAKE_TILT_DEG,
        spin,
        wordMotion,
    } from "./effects.ts";
    import { fitScale, textWidth } from "./fitText.ts";
    import { flipLetters } from "./fontFlip.ts";
    import { WORD_FONT, WORD_WEIGHT } from "./fonts.ts";
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
    // The word gets 10px; the small tags would vanish with that, this keeps about the same share of their size
    const TAG_BLUR = "blur(0.14em)";
    const WORD_HEIGHT_SHARE = 0.24;
    const WORD_WIDTH_SHARE = 0.9;
    // TWO WORDS: both words get this share of the normal size and sit this many font sizes above and below the middle
    const TWO_WORDS_SIZE = 0.8;
    const TWO_WORDS_OFFSET = 0.75;
    // No text below 10 px, not even the zoomed word
    const MIN_FONT_PX = 10;
    // Assembling letters start this many font sizes outside the screen
    const ASSEMBLE_MARGIN = 0.5;

    const has = (id: ModifierId): boolean => challenge.modifiers.has(id);

    // Animations play faster in later levels: the time each one has run, at its own tempo
    const played = (id: ModifierGroupId): number => elapsed * (challenge.tempo[id] ?? 1);

    const opacity = $derived(has("blink") ? fadeOpacity(played("blink")) : 1);
    const word = $derived(has("spam") ? SPAM_WORD : wordFor(challenge.word, colorblind));
    const shownWord = $derived(has("scrambled") ? scramble(word, challenge.seed, played("scrambled")) : word);
    const secondWord = $derived(challenge.second ? wordFor(challenge.second.word, colorblind) : null);
    const tags = $derived(
        [
            ...(has("noClick") ? ["DON'T CLICK"] : []),
            ...(has("invertInput") ? ["INVERTED INPUT"] : []),
            ...(has("wait") ? [elapsed < timeLimit * WAIT_SHARE ? "WAIT" : "NOW"] : []),
            ...(has("doubleTap") ? ["DOUBLE TAP"] : []),
            ...(has("twoWords") ? ["BOTH OR NEITHER"] : []),
        ].map((tag) => (has("scrambled") ? scrambleWords(tag, challenge.seed, played("scrambled")) : tag)),
    );
    // These draw the word in pieces, each piece in the ink
    const pieces = $derived(has("splitMirror") || has("fontFlip") || has("assemble"));
    let tagsWidth = $state(0);
    let tagsHeight = $state(0);

    const fullSize = $derived(height * WORD_HEIGHT_SHARE * (secondWord ? TWO_WORDS_SIZE : 1));
    const maxWidth = $derived(WORD_WIDTH_SHARE * (has("rotation") ? Math.min(width, height) : width));
    // Font size relative to the height, shrunk to fit narrow (or rotated) screens and to leave room for the effects
    const fontSize = $derived.by(() => {
        const lines = [word, ...(secondWord ? [secondWord] : [])].map((text) => ({ text, fontSize: fullSize }));
        const fitted = fullSize * fitScale(lines, maxWidth, WORD_FONT, WORD_WEIGHT);
        const size = fitted * effectFontScale(challenge.modifiers) * challenge.size;
        return challenge.size < 1 ? Math.max(MIN_FONT_PX, size) : size;
    });
    // TWO WORDS: the upper word sits this far above the middle, the lower one as far below it
    const lineOffset = $derived(secondWord ? fontSize * TWO_WORDS_OFFSET : 0);

    const flipped = $derived(
        has("fontFlip")
            ? flipLetters(shownWord, challenge.seed, played("fontFlip"), fullSize / fontSize, maxWidth / fontSize)
            : [],
    );

    // ASSEMBLE: every letter flies in from its own point outside the screen to its place in the word
    const assembled = $derived.by(() => {
        if (!has("assemble")) return [];
        const letters = [...shownWord];
        const widths = letters.map((text) => textWidth({ text, fontSize }, WORD_FONT, WORD_WEIGHT));
        let left = -widths.reduce((sum, letterWidth) => sum + letterWidth, 0) / 2;
        return letters.map((char, index) => {
            const place = left + widths[index] / 2;
            left += widths[index];
            const start = assembleStart(challenge.seed, index, { width, height }, fontSize * ASSEMBLE_MARGIN);
            const remaining = assembleRemaining(challenge.seed, index, elapsed, timeLimit);
            return { char, x: (start.x - place) * remaining, y: start.y * remaining };
        });
    });

    const afterimage = $derived(has("negative") ? afterimageOpacity(elapsed, timeLimit) : 0);

    // Space the word takes up, a rotated word may point in any direction and a shaking one tilts a little. The rule
    // tags move with it: above it, or below when it is mirrored upside down, and around it when it rotates.
    const extent = $derived.by(() => {
        const wordWidth = Math.max(
            ...[word, ...(secondWord ? [secondWord] : [])].map((text) =>
                textWidth({ text, fontSize }, WORD_FONT, WORD_WEIGHT),
            ),
        );
        const tilt = has("shaky") ? wordWidth * Math.sin((SHAKE_TILT_DEG * Math.PI) / 180) : 0;
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

    const transform = $derived.by(() => {
        const area = { width, height: height * FREE_HEIGHT_SHARE };
        const { x, y, scale, rotation } = wordMotion(
            challenge.modifiers,
            challenge.seed,
            elapsed,
            area,
            extent,
            challenge.tempo,
        );
        const turned =
            rotation + (has("rotation") ? challenge.rotationDeg + spin(challenge.seed, played("rotation")) : 0);
        const mirrorX = has("mirrorHorizontal") || has("mirrorBoth") ? -1 : 1;
        const mirrorY = has("mirrorVertical") || has("mirrorBoth") ? -1 : 1;
        return `translate(${x}px, ${y}px) rotate(${turned}deg) scale(${mirrorX * scale}, ${mirrorY * scale})`;
    });
</script>

{#snippet colorWord(text: string, color: Color, offset: number)}
    <div
        class="word"
        data-ink={color}
        style={inkStyle(color, colorblind)}
        style:transform="translate(-50%, calc(-50% + {offset}px))"
    >
        {text}
    </div>
{/snippet}

<div
    class="screen"
    style:background={challenge.background ? backgroundStyle(challenge.background, colorblind) : "#000"}
>
    <!-- Blink only fades the word and its rule tags, the background stays. The tags get every effect of the word. -->
    {#if opacity > 0}
        <div bind:this={anchor} class="anchor" style:transform style:opacity={opacity < 1 ? opacity : null}>
            <!-- The word comes first: the loss animation reads it as the anchor's first child and draws every piece of
                 it with data-ink in that ink -->
            {#if !hideWord && challenge.second && secondWord}
                <div class="pair" style:font-size="{fontSize}px">
                    {@render colorWord(shownWord, challenge.color, -lineOffset)}
                    {@render colorWord(secondWord, challenge.second.color, lineOffset)}
                </div>
            {:else if !hideWord}
                <!-- SPAM! is not about the color, its characters light up in plain ink -->
                <div
                    class="word"
                    data-ink={pieces ? null : challenge.color}
                    style={pieces ? null : inkStyle(challenge.color, colorblind && !has("spam"))}
                    style:font-size="{fontSize}px"
                    style:filter={has("blur") ? "blur(10px)" : null}
                >
                    {#if has("spam")}
                        {#each [...shownWord] as character, index (index)}
                            <span style:color={index < spamCount ? null : SPAM_DIM}>{character}</span>
                        {/each}
                    {:else if has("splitMirror")}
                        <SplitMirror text={shownWord} color={challenge.color} {colorblind} />
                    {:else if has("fontFlip")}
                        {#each flipped as letter, index (index)}
                            <span
                                class="letter"
                                data-ink={challenge.color}
                                style={inkStyle(challenge.color, colorblind)}
                                style:font-family={letter.font.family}
                                style:font-weight={letter.font.weight}
                                style:font-size="{letter.size}em">{letter.char}</span
                            >
                        {/each}
                    {:else if has("assemble")}
                        {#each assembled as letter, index (index)}
                            <span
                                class="letter"
                                data-ink={challenge.color}
                                style={inkStyle(challenge.color, colorblind)}
                                style:transform="translate({letter.x}px, {letter.y}px)">{letter.char}</span
                            >
                        {/each}
                    {:else}
                        {shownWord}
                    {/if}
                </div>
            {/if}
            {#if afterimage > 0 && !hideWord}
                <!-- NEGATIVE: the word in its negative colors, behind the word -->
                <div
                    class="word afterimage"
                    style={inkStyle(challenge.color, colorblind)}
                    style:font-size="{fontSize}px"
                    style:opacity={afterimage}
                >
                    {shownWord}
                </div>
            {/if}
            {#if tags.length > 0}
                <div
                    class="tags"
                    style:top="{-(lineOffset + fontSize * TAG_GAP)}px"
                    bind:clientWidth={tagsWidth}
                    bind:clientHeight={tagsHeight}
                >
                    {#each tags as tag, index (index)}
                        <span class="tag" style:filter={has("blur") ? TAG_BLUR : null}>{tag}</span>
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

    .tag {
        padding: 8px 10px;
        background: #fff;
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

    .word {
        position: absolute;
        transform: translate(-50%, -50%);
        font-family: Orbitron, sans-serif;
        font-weight: 900;
        line-height: 1;
        white-space: nowrap;
    }

    /* Zero-size like the anchor, the two words are placed around it */
    .pair {
        position: absolute;
    }

    .letter {
        display: inline-block;
    }

    .afterimage {
        z-index: -1;
        transform: translate(calc(-50% + 12px), calc(-50% + 8px));
        filter: invert(1);
    }
</style>
