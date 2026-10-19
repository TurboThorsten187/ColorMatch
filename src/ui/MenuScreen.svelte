<script lang="ts">
    import { COLOR_CSS, randomColor } from "../game/colors.ts";

    interface Props {
        highscore: number;
        onstart: () => void;
        onstats: () => void;
        onsetup: () => void;
        // Only while the browser offers to install the game
        oninstall?: () => void;
    }

    let { highscore, onstart, onstats, onsetup, oninstall }: Props = $props();

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
    {#if oninstall}
        <button class="install" onclick={oninstall}>INSTALL</button>
    {/if}

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
    <!-- Selected from the start, so Enter and the arrow keys begin here -->
    <button class="start blink" onclick={onstart} {@attach (node) => node.focus()}>PRESS START</button>

    <div class="buttons">
        <button class="stats" onclick={onstats}>STATS</button>
        <button class="setup" onclick={onsetup}>SETUP</button>
    </div>
</div>

<style>
    /* Hi-score on top, buttons at the bottom, the auto margins of .title and .buttons center the rest.
       Everything stays in the flow so nothing overlaps on short screens. */
    .menu {
        position: absolute;
        inset: 0;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: max(40px, calc(6 * var(--unit)));
        padding: calc(env(safe-area-inset-top) + max(32px, calc(4 * var(--unit)))) 0
            calc(env(safe-area-inset-bottom) + max(48px, calc(7 * var(--unit))));
    }

    @media (max-height: 520px) {
        .menu {
            gap: 16px;
            padding-top: calc(env(safe-area-inset-top) + 16px);
            padding-bottom: calc(env(safe-area-inset-bottom) + 16px);
        }
    }

    .hiscore {
        text-align: center;
        font-size: max(11px, calc(1.8 * var(--unit)));
        line-height: 1.8;
    }

    .label {
        color: #ff3b4e;
    }

    .title {
        margin: auto 0 0;
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
        flex: none;
        height: auto;
        padding: 10px 14px;
        border-color: transparent;
        background: none;
        font-size: max(13px, calc(2.4 * var(--unit)));
        color: #ffe14d;
    }

    /* A selected PRESS START stays visible */
    :global(.keys) .start:focus {
        animation: none;
    }

    .buttons {
        margin-top: auto;
        width: calc(100% - 80px);
        display: flex;
        justify-content: center;
        gap: 16px;
    }

    button {
        flex: 0 1 180px;
        height: 52px;
        border: 4px solid #fff;
        border-radius: 0;
        background: #000;
        color: #fff;
        font-family: inherit;
        font-size: 11px;
        cursor: pointer;
    }

    .stats {
        box-shadow: 4px 4px 0 #1765fb;
    }

    .setup {
        box-shadow: 4px 4px 0 #ff3b4e;
    }

    /* Small and out of the way, it stays clear of the hi-score down to 320 px wide screens */
    .install {
        position: absolute;
        top: calc(env(safe-area-inset-top) + 16px);
        right: calc(env(safe-area-inset-right) + 16px);
        height: 40px;
        padding: 0 8px;
        border: 3px solid #3dff7a;
        color: #3dff7a;
    }
</style>
