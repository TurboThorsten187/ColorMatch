<script lang="ts">
    import { COLOR_CSS } from "../game/colors.ts";

    interface Props {
        level: number;
        highscore: number;
        // Share of the time limit that is left, 0 to 1
        remaining: number;
    }

    let { level, highscore, remaining }: Props = $props();

    const SEGMENTS = Array.from({ length: 10 }, (_, i) => i);

    const share = $derived(Math.min(1, Math.max(0, remaining)));
    const lit = $derived(Math.ceil(share * SEGMENTS.length));
    const color = $derived(share > 0.5 ? COLOR_CSS.green : share > 0.25 ? COLOR_CSS.yellow : COLOR_CSS.red);
</script>

<div class="bar">
    <div class="hud">
        <span>LV {level}</span>
        <span class="hi">HI {String(highscore).padStart(3, "0")}</span>
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
            <div class="segment" style:background={i < lit ? color : null}></div>
        {/each}
    </div>
</div>

<style>
    .bar {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: calc(env(safe-area-inset-top) + 16px) 24px 12px;
        background: #000;
    }

    .hud {
        display: flex;
        justify-content: space-between;
        font-size: max(11px, calc(1.6 * var(--unit)));
    }

    .hi {
        color: #ff3b4e;
    }

    .timer {
        display: grid;
        grid-template-columns: repeat(10, minmax(0, 1fr));
        gap: 4px;
    }

    .segment {
        height: max(14px, calc(1.6 * var(--unit)));
        background: #262626;
    }
</style>
