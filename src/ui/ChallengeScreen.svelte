<script lang="ts">
    import type { Challenge } from "../game/challenge.ts";
    import { COLOR_CSS } from "../game/colors.ts";
    import { SPAM_WORD } from "../game/game.ts";
    import type { ModifierGroupId, ModifierId } from "../game/modifiers.ts";
    import { effectFontScale, fadeOpacity, scramble, SHAKE_TILT_DEG, spin, wordMotion } from "./effects.ts";
    import { fitScale, textWidth } from "./fitText.ts";
    import { WORD_FONT, WORD_WEIGHT } from "./fonts.ts";

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
    }

    let { challenge, elapsed, width, height, spamCount = 0, hideWord = false, anchor = $bindable() }: Props = $props();

    const SPAM_DIM = "#3a3a3a";
    // Moving words stay out of the top bar and the TRUE / FALSE labels
    const FREE_HEIGHT_SHARE = 0.62;

    const has = (id: ModifierId): boolean => challenge.modifiers.has(id);

    // Animations play faster in later levels: the time each one has run, at its own tempo
    const played = (id: ModifierGroupId): number => elapsed * (challenge.tempo[id] ?? 1);

    const opacity = $derived(has("blink") ? fadeOpacity(played("blink")) : 1);
    const word = $derived(has("spam") ? SPAM_WORD : challenge.word.toUpperCase());
    const shownWord = $derived(has("scrambled") ? scramble(word, challenge.seed, played("scrambled")) : word);
    const tags = $derived([
        ...(has("noClick") ? ["DON'T CLICK"] : []),
        ...(has("invertInput") ? ["INVERTED INPUT"] : []),
    ]);

    // Font size relative to the height, shrunk to fit narrow (or rotated) screens and to leave room for the effects
    const fontSize = $derived.by(() => {
        const size = height * 0.24;
        const maxWidth = 0.9 * (has("rotation") ? Math.min(width, height) : width);
        const fitted = size * fitScale([{ text: word, fontSize: size }], maxWidth, WORD_FONT, WORD_WEIGHT);
        return fitted * effectFontScale(challenge.modifiers);
    });

    // Space the word takes up, a rotated word may point in any direction and a shaking one tilts a little
    const extent = $derived.by(() => {
        const wordWidth = textWidth({ text: word, fontSize }, WORD_FONT, WORD_WEIGHT);
        if (has("rotation")) return { width: wordWidth, height: wordWidth };
        const tilt = has("shaky") ? wordWidth * Math.sin((SHAKE_TILT_DEG * Math.PI) / 180) : 0;
        return { width: wordWidth, height: fontSize + tilt };
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

<div class="screen" style:background={challenge.background ? COLOR_CSS[challenge.background] : "#000"}>
    {#if tags.length > 0}
        <div class="tags" style:top="calc(50% - {fontSize * 0.6}px)">
            {#each tags as tag (tag)}
                <span class="tag">{tag}</span>
            {/each}
        </div>
    {/if}

    <!-- Blink only fades the word, background and tags stay -->
    {#if opacity > 0 && !hideWord}
        <div
            bind:this={anchor}
            class="anchor"
            style:transform
            style:filter={has("blur") ? "blur(10px)" : null}
            style:opacity={opacity < 1 ? opacity : null}
            style:color={COLOR_CSS[challenge.color]}
        >
            <div class="word" style:font-size="{fontSize}px">
                {#if has("spam")}
                    {#each [...shownWord] as character, index (index)}
                        <span style:color={index < spamCount ? null : SPAM_DIM}>{character}</span>
                    {/each}
                {:else}
                    {shownWord}
                {/if}
            </div>
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
        left: 50%;
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
