<script lang="ts">
    import type { Challenge } from "../game/challenge.ts";
    import { wordFor } from "../game/colors.ts";
    import { SPAM_WORD } from "../game/game.ts";
    import type { ModifierGroupId, ModifierId } from "../game/modifiers.ts";
    import {
        effectFontScale,
        fadeOpacity,
        scramble,
        scrambleWords,
        SHAKE_TILT_DEG,
        spin,
        wordMotion,
    } from "./effects.ts";
    import { fitScale, textWidth } from "./fitText.ts";
    import { WORD_FONT, WORD_WEIGHT } from "./fonts.ts";
    import { backgroundStyle, inkStyle } from "./shapes.ts";

    interface Props {
        challenge: Challenge;
        // Time since the challenge appeared in ms
        elapsed: number;
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

    const has = (id: ModifierId): boolean => challenge.modifiers.has(id);

    // Animations play faster in later levels: the time each one has run, at its own tempo
    const played = (id: ModifierGroupId): number => elapsed * (challenge.tempo[id] ?? 1);

    const opacity = $derived(has("blink") ? fadeOpacity(played("blink")) : 1);
    const word = $derived(has("spam") ? SPAM_WORD : wordFor(challenge.word, colorblind));
    const shownWord = $derived(has("scrambled") ? scramble(word, challenge.seed, played("scrambled")) : word);
    const tags = $derived(
        [...(has("noClick") ? ["DON'T CLICK"] : []), ...(has("invertInput") ? ["INVERTED INPUT"] : [])].map((tag) =>
            has("scrambled") ? scrambleWords(tag, challenge.seed, played("scrambled")) : tag,
        ),
    );
    let tagsWidth = $state(0);
    let tagsHeight = $state(0);

    // Font size relative to the height, shrunk to fit narrow (or rotated) screens and to leave room for the effects
    const fontSize = $derived.by(() => {
        const size = height * 0.24;
        const maxWidth = 0.9 * (has("rotation") ? Math.min(width, height) : width);
        const fitted = size * fitScale([{ text: word, fontSize: size }], maxWidth, WORD_FONT, WORD_WEIGHT);
        return fitted * effectFontScale(challenge.modifiers);
    });

    // Space the word takes up, a rotated word may point in any direction and a shaking one tilts a little. The rule
    // tags move with it: above it, or below when it is mirrored upside down, and around it when it rotates.
    const extent = $derived.by(() => {
        const wordWidth = textWidth({ text: word, fontSize }, WORD_FONT, WORD_WEIGHT);
        const tilt = has("shaky") ? wordWidth * Math.sin((SHAKE_TILT_DEG * Math.PI) / 180) : 0;
        const alone = has("rotation")
            ? { width: wordWidth, height: wordWidth }
            : { width: wordWidth, height: fontSize + tilt };
        if (tags.length === 0) return alone;
        const reach = fontSize * TAG_GAP + tagsHeight;
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

<div
    class="screen"
    style:background={challenge.background ? backgroundStyle(challenge.background, colorblind) : "#000"}
>
    <!-- Blink only fades the word and its rule tags, the background stays. The tags get every effect of the word. -->
    {#if opacity > 0}
        <div bind:this={anchor} class="anchor" style:transform style:opacity={opacity < 1 ? opacity : null}>
            <!-- The word comes first: the loss animation reads it as the anchor's first child -->
            {#if !hideWord}
                <!-- SPAM! is not about the color, its characters light up in plain ink -->
                <div
                    class="word"
                    style={inkStyle(challenge.color, colorblind && !has("spam"))}
                    style:font-size="{fontSize}px"
                    style:filter={has("blur") ? "blur(10px)" : null}
                >
                    {#if has("spam")}
                        {#each [...shownWord] as character, index (index)}
                            <span style:color={index < spamCount ? null : SPAM_DIM}>{character}</span>
                        {/each}
                    {:else}
                        {shownWord}
                    {/if}
                </div>
            {/if}
            {#if tags.length > 0}
                <div
                    class="tags"
                    style:top="{-fontSize * TAG_GAP}px"
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
</style>
