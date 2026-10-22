<script lang="ts">
    import { HARDCORE_UNLOCK_SCORE } from "@/core/balance.ts";
    import { COLOR_CSS, COLORS } from "@/core/colors.ts";
    import { answerOn } from "@/core/settings.ts";

    interface Props {
        highscore: number;
        hardcoreHighscore: number;
        // Locked, a press of HARDCORE shows what opens it
        hardcoreUnlocked: boolean;
        // FALSE on the left, TRUE on the right
        flipControls: boolean;
        onstart: () => void;
        onhardcore: () => void;
        onstats: () => void;
        onsetup: () => void;
        // Only while the browser offers to install the game
        oninstall?: () => void;
    }

    let {
        highscore,
        hardcoreHighscore,
        hardcoreUnlocked,
        flipControls,
        onstart,
        onhardcore,
        onstats,
        onsetup,
        oninstall,
    }: Props = $props();

    const TITLE_LINES = ["COLOR", "MATCH"];
    const WAVE_STEP_MS = 300;
    // How long a press of the locked HARDCORE shows what opens it
    const LOCK_HINT_MS = 2000;

    // The letters show the colors in their order, and the colors move on by one letter every step
    let wave = $state(0);
    let lockHint = $state(false);

    $effect(() => {
        const interval = setInterval(() => wave++, WAVE_STEP_MS);
        return () => clearInterval(interval);
    });

    $effect(() => {
        if (!lockHint) return;
        const timeout = setTimeout(() => (lockHint = false), LOCK_HINT_MS);
        return () => clearTimeout(timeout);
    });
</script>

<div class="menu" class:crowded={oninstall !== undefined && hardcoreUnlocked}>
    {#if oninstall}
        <button class="install" onclick={oninstall}>INSTALL</button>
    {/if}

    <div class="hiscore">
        <div>
            <div class="label">HI-SCORE</div>
            <div>{String(highscore).padStart(6, "0")}</div>
        </div>
        {#if hardcoreUnlocked}
            <div>
                <div class="label">HARDCORE</div>
                <div class="hard">{String(hardcoreHighscore).padStart(6, "0")}</div>
            </div>
        {/if}
    </div>

    <h1 class="title">
        {#each TITLE_LINES as line, row (row)}
            <span class="line">
                {#each line as letter, col (col)}
                    <span style:color={COLOR_CSS[COLORS[(row * TITLE_LINES[0].length + col + wave) % COLORS.length]]}
                        >{letter}</span
                    >
                {/each}
            </span>
        {/each}
    </h1>

    <div class="controls">
        <span>◄ {answerOn("left", flipControls).toUpperCase()}</span>
        <span>{answerOn("right", flipControls).toUpperCase()} ►</span>
    </div>
    <div class="play">
        <!-- Selected from the start, so Enter and the arrow keys begin here -->
        <button class="start" onclick={onstart} {@attach (node) => node.focus()}>START GAME</button>
        <!-- Locked it can still be selected and pressed, and then tells what opens it -->
        <div class="slot">
            <button
                class="hardcore"
                aria-disabled={!hardcoreUnlocked}
                aria-describedby={hardcoreUnlocked ? undefined : "hardcore-hint"}
                onclick={hardcoreUnlocked ? onhardcore : () => (lockHint = true)}
            >
                {#if !hardcoreUnlocked}
                    <svg class="lock" viewBox="0 0 10 12" aria-hidden="true">
                        <rect x="2" width="6" height="2" />
                        <rect x="1" y="1" width="2" height="5" />
                        <rect x="7" y="1" width="2" height="5" />
                        <rect y="5" width="10" height="7" />
                    </svg>
                {/if}
                HARDCORE
            </button>
            {#if !hardcoreUnlocked}
                <span id="hardcore-hint" class="hint" class:shown={lockHint}>CLEAR LEVEL {HARDCORE_UNLOCK_SCORE}</span>
            {/if}
        </div>
    </div>

    <div class="buttons">
        <button class="stats" onclick={onstats}>STATS</button>
        <button class="setup" onclick={onsetup}>SETTINGS</button>
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

    /* Browser windows are wider than high: there the menu's sizes follow the height, so it fits without scrolling
       and leaves the bottom free for App's keys hint. Phones in landscape have their own spacing below. */
    @media (min-height: 521px) {
        .menu {
            --unit: min(1vw, 1.05dvh, 10px);
        }
    }

    @media (max-height: 520px) {
        .menu {
            gap: 12px;
            padding-top: calc(env(safe-area-inset-top) + 16px);
            padding-bottom: calc(env(safe-area-inset-bottom) + 16px);
        }
    }

    .hiscore {
        display: flex;
        gap: 32px;
        text-align: center;
        font-size: max(11px, calc(1.8 * var(--unit)));
        line-height: 1.8;
    }

    /* Both hi-scores side by side reach under INSTALL on narrow screens, there they move down below it */
    @media (max-width: 459px) {
        .crowded .hiscore {
            margin-top: 48px;
        }
    }

    .play {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
    }

    /* HARDCORE sits below START GAME, only phones in landscape have no room for that and put them side by side */
    @media (max-height: 520px) {
        .play {
            flex-direction: row;
            gap: 24px;
        }
    }

    .label,
    .hard {
        color: var(--red);
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

    /* The two ways to play, the same size whether HARDCORE is locked or not */
    .start,
    .hardcore {
        flex: none;
        width: max(240px, calc(30 * var(--unit)));
        height: max(56px, calc(6.4 * var(--unit)));
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: max(13px, calc(1.6 * var(--unit)));
    }

    .start {
        --button-color: var(--yellow);
        color: var(--yellow);
    }

    .hardcore {
        --button-color: var(--red);
        color: var(--red);
    }

    /* Locked it is gray, but selected and pressed in red like when it is open */
    .hardcore[aria-disabled="true"] {
        border-color: #444;
        color: #666;
        cursor: default;
    }

    .slot {
        position: relative;
    }

    .lock {
        width: 0.9em;
        height: 1.1em;
        flex: none;
        fill: currentColor;
        shape-rendering: crispEdges;
    }

    /* Below the button and out of the flow, so showing it does not move the menu */
    .hint {
        position: absolute;
        top: calc(100% + 10px);
        left: 0;
        right: 0;
        text-align: center;
        font-size: 10px;
        color: #bbb;
        visibility: hidden;
    }

    .hint.shown {
        visibility: visible;
    }

    /* In the browser and on phones in landscape all four buttons have the same size */
    @media (max-height: 520px), (min-width: 600px) {
        .start,
        .hardcore,
        .buttons button {
            flex: none;
            width: max(200px, calc(24 * var(--unit)));
            height: max(52px, calc(5.8 * var(--unit)));
            font-size: max(12px, calc(1.3 * var(--unit)));
        }

        .buttons {
            gap: 24px;
        }
    }

    /* Short screens have no room below it, there the hint covers the label inside the border */
    @media (max-height: 520px) {
        .hint {
            inset: 4px;
            display: grid;
            place-items: center;
            background: #000;
        }
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
        --button-color: var(--blue);
    }

    .setup {
        --button-color: var(--red);
    }

    /* Small and out of the way in the top right corner; green already, so it is selected in the accent */
    .install {
        position: absolute;
        top: calc(env(safe-area-inset-top) + 16px);
        right: calc(env(safe-area-inset-right) + 16px);
        height: 40px;
        padding: 0 8px;
        border: 3px solid var(--green);
        color: var(--green);
    }
</style>
