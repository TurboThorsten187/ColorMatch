<script lang="ts">
    import type { Snippet } from "svelte";
    import { COLOR_CSS } from "@/core/colors.ts";
    import { holdPress } from "./focus.ts";

    interface Props {
        // Keys were used last: the selected button shows
        keys: boolean;
        // Red highlights instead of yellow
        hardcore: boolean;
        scanlines: boolean;
        // The strip that explains the keys, on screens with buttons while keys are used
        keyHelp: boolean;
        element?: HTMLElement;
        width?: number;
        height?: number;
        children: Snippet;
    }

    let {
        keys,
        hardcore,
        scanlines,
        keyHelp,
        element = $bindable(),
        width = $bindable(0),
        height = $bindable(0),
        children,
    }: Props = $props();
</script>

<!-- Every screen draws with the game's colors and highlights in --accent -->
<main
    class="stage"
    class:keys
    class:hardcore
    style:--red={COLOR_CSS.red}
    style:--green={COLOR_CSS.green}
    style:--blue={COLOR_CSS.blue}
    style:--yellow={COLOR_CSS.yellow}
    style:--purple={COLOR_CSS.purple}
    style:--cyan={COLOR_CSS.cyan}
    onclickcapture={holdPress}
    bind:this={element}
    bind:clientWidth={width}
    bind:clientHeight={height}
>
    {@render children()}

    {#if keyHelp}
        <div class="key-help" aria-hidden="true">ARROWS SELECT · ENTER OK · ESC BACK</div>
    {/if}

    {#if scanlines}
        <div class="scanlines" aria-hidden="true"></div>
    {/if}
</main>

<style>
    .stage {
        position: fixed;
        inset: 0;
        overflow: hidden;
        background: #000;
        color: #fff;
        font-family: "Press Start 2P", monospace;
        cursor: default;
        /* Fast tapping must not scroll, zoom, select text or show callouts and tap highlights */
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        -webkit-tap-highlight-color: transparent;
        /* Size unit: 1 % of the width, capped by the height and on large screens */
        --unit: min(1vw, 1.8dvh, 10px);
        /* The highlight color of every screen a game shows, red in hardcore */
        --accent: var(--yellow);
    }

    .stage.hardcore {
        --accent: var(--red);
    }

    /* Screens focus a button on their own so Enter works at once; the browser's focus ring would show that before
       any key is pressed, the selection only appears as the colors below */
    .stage :global(:is(button, [role="slider"]):focus) {
        outline: none;
    }

    /* A button sets --button-color to be selected in it; without one it is selected in the accent */
    .stage :global(:is(button, [role="slider"])) {
        --select: var(--button-color, var(--accent));
    }

    /* The selection, moved with the arrow keys, WASD, Tab or the mouse, and a pressed button: border and text take
       the button's color */
    .stage.keys :global(:is(button, [role="slider"]):focus),
    .stage :global(button[data-press]) {
        border-color: var(--select);
        color: var(--select);
    }

    /* scale, not transform, which some buttons use to position themselves */
    .stage :global(button[data-press]) {
        scale: 0.92;
    }

    /* A black strip, so scrolled content passes under it; screens keep 40 px free at the bottom for it */
    .key-help {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        padding: 12px 0 calc(env(safe-area-inset-bottom) + 12px);
        background: #000;
        text-align: center;
        font-size: 10px;
        color: #777;
        pointer-events: none;
    }

    /* Short screens have no room below their buttons */
    @media (max-height: 520px) {
        .key-help {
            display: none;
        }
    }

    /* CRT look */
    .scanlines {
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: repeating-linear-gradient(to bottom, rgb(255 255 255 / 0.05) 0 1px, transparent 1px 3px);
    }
</style>
