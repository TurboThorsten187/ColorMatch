<script lang="ts">
    import type { Challenge } from "../game/challenge.ts";
    import { COLOR_CSS } from "../game/colors.ts";
    import type { ModifierId } from "../game/modifiers.ts";
    import { effectFontScale, scramble, wordMotion } from "./effects.ts";
    import { fitScale, textWidth } from "./fitText.ts";
    import { WORD_FONT, WORD_WEIGHT } from "./fonts.ts";

    interface Props {
        challenge: Challenge;
        // Time since the challenge appeared in ms
        elapsed: number;
        width: number;
        height: number;
    }

    let { challenge, elapsed, width, height }: Props = $props();

    const BLINK_VISIBLE_MS = 500;
    // Moving words stay out of the top bar and the TRUE / FALSE labels
    const FREE_HEIGHT_SHARE = 0.62;

    const has = (id: ModifierId): boolean => challenge.modifiers.has(id);

    const blinkedOut = $derived(has("blink") && elapsed > BLINK_VISIBLE_MS);
    const word = $derived(has("spam") ? "SPAM!" : challenge.word.toUpperCase());
    const shownWord = $derived(has("scrambled") ? scramble(word, challenge.seed, elapsed) : word);
    const tags = $derived([
        ...(has("invertColors") ? ["INVERTED COLORS"] : []),
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

    // Space the word takes up, a rotated word may point in any direction
    const extent = $derived.by(() => {
        const wordWidth = textWidth({ text: word, fontSize }, WORD_FONT, WORD_WEIGHT);
        return has("rotation") ? { width: wordWidth, height: wordWidth } : { width: wordWidth, height: fontSize };
    });

    const transform = $derived.by(() => {
        const area = { width, height: height * FREE_HEIGHT_SHARE };
        const { x, y, scale } = wordMotion(challenge.modifiers, challenge.seed, elapsed, area, extent);
        const mirrorX = has("mirrorHorizontal") ? -1 : 1;
        const mirrorY = has("mirrorVertical") ? -1 : 1;
        return `translate(${x}px, ${y}px) rotate(${challenge.rotationDeg}deg) scale(${mirrorX * scale}, ${mirrorY * scale})`;
    });
</script>

<div
    class="screen"
    class:inverted={has("invertColors")}
    style:background={challenge.background ? COLOR_CSS[challenge.background] : "#000"}
>
    {#if tags.length > 0}
        <div class="tags" style:top="calc(50% - {fontSize * 0.6}px)">
            {#each tags as tag (tag)}
                <span class="tag">{tag}</span>
            {/each}
        </div>
    {/if}

    <!-- Blink only hides the word, background, tags and inverted colors stay -->
    {#if !blinkedOut}
        <div
            class="anchor"
            style:transform
            style:filter={has("blur") ? "blur(10px)" : null}
            style:color={COLOR_CSS[challenge.color]}
        >
            <div class="word" style:font-size="{fontSize}px">{shownWord}</div>
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

    .inverted {
        filter: invert(1);
    }
</style>
