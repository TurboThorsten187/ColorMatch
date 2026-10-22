<script lang="ts">
    import type { Challenge } from "@/core/challenge.ts";
    import { SIGN_BLUR_EM_PER_PX } from "@/modifiers/blur/look.ts";
    import RuleSign from "./RuleSign.svelte";
    import { backgroundStyle, inkStyle } from "./shapes.ts";
    import SplitMirror from "./SplitMirror.svelte";
    import { type Layout, type Line, STAGE, wordFrame } from "./wordFrame.ts";

    interface Props {
        challenge: Challenge;
        // Time since the challenge appeared in ms
        elapsed: number;
        // The level's time limit in ms: assembling, WAIT and the negative's afterimage run on shares of it
        timeLimit: number;
        // The box the word is drawn in
        width: number;
        height: number;
        // The whole stage, or the example box of an intro card
        layout?: Layout;
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
        layout = STAGE,
        spamCount = 0,
        hideWord = false,
        anchor = $bindable(),
        colorblind = false,
    }: Props = $props();

    const SPAM_DIM = "#3a3a3a";

    let signsWidth = $state(0);
    let signsHeight = $state(0);

    // Everything the word looks like at this moment, src/ui/word/wordFrame.ts
    const frame = $derived(
        wordFrame({
            challenge,
            elapsed,
            timeLimit,
            box: { width, height },
            layout,
            spamCount,
            colorblind,
            signsSize: { width: signsWidth, height: signsHeight },
        }),
    );
    const transform = $derived(
        `translate(${frame.anchor.x}px, ${frame.anchor.y}px) rotate(${frame.anchor.rotation}deg) ` +
            `scale(${frame.anchor.scaleX}, ${frame.anchor.scaleY})`,
    );
</script>

{#snippet content(line: Line)}
    {#if line.letters}
        {#each line.letters as letter, index (index)}
            <span
                class="letter"
                class:placed={letter.placed}
                data-ink={line.color}
                style={letter.dim ? `color: ${SPAM_DIM}` : inkStyle(line.color, frame.shapes)}
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
    {@const ink = line.letters || frame.splitMirror ? null : line.color}
    <div
        class="word"
        data-ink={ink}
        style={ink ? inkStyle(ink, colorblind) : null}
        style:transform="translate(-50%, calc(-50% + {line.offset}px))"
        style:filter={frame.blur === null ? null : `blur(${frame.blur}px)`}
    >
        {#if frame.splitMirror}
            <SplitMirror ink={line.letters ? null : line.color} {colorblind}>{@render content(line)}</SplitMirror>
        {:else}
            {@render content(line)}
        {/if}
    </div>
{/snippet}

<div
    class="screen"
    style:background={challenge.background
        ? backgroundStyle(challenge.background, colorblind, layout.smallBackground)
        : "#000"}
>
    <!-- FADE only fades the word and its rule signs, the background stays. The signs get every effect of the word. -->
    {#if frame.opacity > 0}
        <div bind:this={anchor} class="anchor" style:transform style:opacity={frame.opacity < 1 ? frame.opacity : null}>
            {#if !hideWord}
                <!-- The words come first: the loss animation reads them as the anchor's first child -->
                <div class="lines" style:font-size="{frame.fontSize}px">
                    {#each frame.lines as line, index (index)}
                        {@render wordLine(line)}
                    {/each}
                </div>
                {#if frame.afterimage > 0}
                    <!-- NEGATIVE: the words in their negative colors, behind them -->
                    <div
                        class="lines afterimage"
                        style:font-size="{frame.fontSize}px"
                        style:opacity={frame.afterimage}
                        style:transform="translate({frame.afterimageOffset.x}px, {frame.afterimageOffset.y}px)"
                    >
                        {#each frame.lines as line, index (index)}
                            {@render wordLine(line)}
                        {/each}
                    </div>
                {/if}
            {/if}
            {#if frame.signs.length > 0}
                <div
                    class="signs"
                    style:top="{frame.signsBottom}px"
                    bind:clientWidth={signsWidth}
                    bind:clientHeight={signsHeight}
                >
                    {#each frame.signs as sign, index (index)}
                        <RuleSign
                            icon={sign.icon}
                            text={sign.text}
                            filter={frame.blur === null ? null : `blur(${SIGN_BLUR_EM_PER_PX * frame.blur}em)`}
                        />
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

    .signs {
        position: absolute;
        left: 0;
        transform: translate(-50%, -100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        font-size: max(11px, calc(1.5 * var(--unit)));
    }

    /* Zero-size point in the middle that all transformations pivot around */
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
