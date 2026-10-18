<script module lang="ts">
    // From here on the timer is red
    export const LOW_TIME_SHARE = 0.25;
</script>

<script lang="ts">
    import { COLOR_CSS } from "../game/colors.ts";

    interface Props {
        level: number;
        highscore: number;
        // Share of the time limit that is left, 0 to 1
        remaining: number;
    }

    let { level, highscore, remaining }: Props = $props();

    const SEGMENTS = Array.from({ length: 12 }, (_, i) => i);
    const CENTER = (SEGMENTS.length - 1) / 2;

    const share = $derived(Math.min(1, Math.max(0, remaining)));
    // The segments go out in pairs from both ends towards the middle
    const litPairs = $derived(Math.ceil((share * SEGMENTS.length) / 2));
    const color = $derived(share > 0.5 ? COLOR_CSS.green : share > LOW_TIME_SHARE ? COLOR_CSS.yellow : COLOR_CSS.red);
</script>

<div class="bar">
    <span class="level">LV {level}</span>
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
    <span class="hi">HI {String(highscore).padStart(3, "0")}</span>
</div>

<style>
    .bar {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: calc(env(safe-area-inset-top) + 16px) 24px 14px;
        background: #000;
        font-size: max(11px, calc(1.6 * var(--unit)));
    }

    /* Both labels get the same room, so the timer stays centered and does not jump when the level gets a digit */
    .level,
    .hi {
        flex: none;
        min-width: 6em;
    }

    .hi {
        color: #ff3b4e;
        text-align: right;
    }

    .timer {
        flex: 1;
        display: grid;
        grid-template-columns: repeat(12, minmax(0, 1fr));
        gap: 3px;
    }

    .segment {
        height: max(10px, calc(1.2 * var(--unit)));
        background: #262626;
    }
</style>
