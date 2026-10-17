<script lang="ts">
    import { COLOR_CSS, randomColor } from "../game/colors.ts";

    interface Props {
        highscore: number;
    }

    let { highscore }: Props = $props();

    const TITLE_LINES = ["COLOR", "MATCH"];
    const LETTER_COUNT = TITLE_LINES.join("").length;
    const COLOR_CHANGE_MS = 150;

    // Every letter has its own color, one random letter changes regularly
    const titleColors = $state(Array.from({ length: LETTER_COUNT }, () => randomColor(Math.random)));

    $effect(() => {
        const interval = setInterval(() => {
            titleColors[Math.floor(Math.random() * LETTER_COUNT)] = randomColor(Math.random);
        }, COLOR_CHANGE_MS);
        return () => clearInterval(interval);
    });
</script>

<div class="menu">
    <div class="hiscore">
        <div class="label">HI-SCORE</div>
        <div>{String(highscore).padStart(6, "0")}</div>
    </div>

    <h1 class="title">
        {#each TITLE_LINES as line, row (row)}
            <span class="line">
                {#each line as letter, col (col)}
                    <span style:color={COLOR_CSS[titleColors[row * TITLE_LINES[0].length + col]]}>{letter}</span>
                {/each}
            </span>
        {/each}
    </h1>

    <div class="controls"><span>◄ TRUE</span><span>FALSE ►</span></div>
    <div class="start blink">PRESS START</div>
</div>

<style>
    .menu {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: max(40px, calc(6 * var(--unit)));
    }

    .hiscore {
        position: absolute;
        top: calc(env(safe-area-inset-top) + max(32px, calc(4 * var(--unit))));
        text-align: center;
        font-size: max(11px, calc(1.8 * var(--unit)));
        line-height: 1.8;
    }

    .label {
        color: #ff3b4e;
    }

    .title {
        margin: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.35em;
        font-size: max(30px, calc(9 * var(--unit)));
        font-weight: normal;
        line-height: 1;
    }

    .controls {
        display: flex;
        gap: max(40px, calc(6 * var(--unit)));
        font-size: max(12px, calc(2.2 * var(--unit)));
    }

    .start {
        font-size: max(13px, calc(2.4 * var(--unit)));
        color: #ffe14d;
    }
</style>
