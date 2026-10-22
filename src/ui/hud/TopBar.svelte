<script lang="ts">
    import { COLOR_CSS } from "@/core/colors.ts";
    import { LOW_TIME_SHARE } from "@/core/game.ts";

    type Props = {
        level: number;
        // Share of the time limit that is left, 0 to 1
        remaining: number;
        // Part of the screen's layout instead of lying on top of it, for screens that place content below it
        inline?: boolean;
        // COUNT UP: the timer shows the time that has passed instead, it fills up from the middle
        countUp?: boolean;
    } & (
        | { highscore: number; paused?: false }
        // A paused level shows PAUSED instead of the highscore and a dimmed timer
        | { paused: true }
    );

    let props: Props = $props();

    const SEGMENTS = Array.from({ length: 24 }, (_, i) => i);
    const CENTER = (SEGMENTS.length - 1) / 2;

    const share = $derived(Math.min(1, Math.max(0, props.remaining)));
    // Counting up plays the normal timer backwards: red in the middle at first, turning green as it fills
    const shown = $derived(props.countUp ? 1 - share : share);
    // The segments go out in pairs from both ends towards the middle
    const litPairs = $derived(Math.ceil((shown * SEGMENTS.length) / 2));
    const color = $derived(shown > 0.5 ? COLOR_CSS.green : shown > LOW_TIME_SHARE ? COLOR_CSS.yellow : COLOR_CSS.red);
</script>

<!-- Level and highscore on top, the timer below them over the full width -->
<div class="bar" class:inline={props.inline} class:paused={props.paused}>
    <div class="labels">
        <span>LV {props.level}</span>
        {#if props.paused}
            <span class="status">PAUSED</span>
        {:else}
            <span class="hi">HI {String(props.highscore).padStart(3, "0")}</span>
        {/if}
    </div>
    <div
        class="timer"
        role="progressbar"
        aria-label="Time left"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(share * 100)}
    >
        {#each SEGMENTS as i (i)}
            <div class="segment" style:background={Math.abs(i - CENTER) < litPairs ? color : null}></div>
        {/each}
    </div>
</div>

<style>
    .bar {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        display: grid;
        gap: 10px;
        padding: calc(env(safe-area-inset-top) + 16px) 24px 14px;
        background: #000;
        font-size: max(11px, calc(1.6 * var(--unit)));
    }

    .inline {
        position: static;
        width: 100%;
        padding: 0;
        background: none;
    }

    .labels {
        display: flex;
        justify-content: space-between;
        gap: 10px;
    }

    .hi {
        color: var(--red);
    }

    .status {
        color: var(--accent);
    }

    .timer {
        display: grid;
        grid-template-columns: repeat(24, minmax(0, 1fr));
        gap: 2px;
    }

    .segment {
        height: max(10px, calc(1.2 * var(--unit)));
        background: var(--fill-off);
    }

    .paused .timer {
        opacity: 0.4;
    }
</style>
