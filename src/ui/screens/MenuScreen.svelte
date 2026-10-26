<script lang="ts">
    import { HARDCORE_UNLOCK_SCORE } from "@/core/balance.ts";
    import { COLOR_CSS, COLORS } from "@/core/colors.ts";
    import { answerOn } from "@/core/settings.ts";
    import Button from "@/ui/kit/Button.svelte";

    interface PlayGamesButtons {
        signedIn: boolean;
        onleaderboards: () => void;
        onachievements: () => void;
        onsignin: () => void;
    }

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
        // Only in the app with Play Games: its leaderboards and achievements, SIGN IN while the automatic sign-in failed
        playGames?: PlayGamesButtons;
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
        playGames,
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

<div class="menu" class:crowded={(oninstall !== undefined || playGames !== undefined) && hardcoreUnlocked}>
    {#if playGames}
        <!-- Green like INSTALL across, so it is selected in the accent -->
        <div class="play-games">
            {#if playGames.signedIn}
                <Button
                    square
                    ink="var(--green)"
                    line="var(--green)"
                    aria-label="Leaderboards"
                    onclick={playGames.onleaderboards}
                >
                    <svg class="icon" viewBox="0 0 10 10" aria-hidden="true">
                        <rect x="3" y="2" width="4" height="8" />
                        <rect y="5" width="3" height="5" />
                        <rect x="7" y="4" width="3" height="6" />
                    </svg>
                </Button>
                <Button
                    square
                    ink="var(--green)"
                    line="var(--green)"
                    aria-label="Achievements"
                    onclick={playGames.onachievements}
                >
                    <svg class="icon" viewBox="0 0 10 10" aria-hidden="true">
                        <rect x="2" width="6" height="5" />
                        <rect y="1" width="2" height="2" />
                        <rect x="8" y="1" width="2" height="2" />
                        <rect x="4" y="5" width="2" height="2" />
                        <rect x="2" y="7" width="6" height="3" />
                    </svg>
                </Button>
            {:else}
                <Button ink="var(--green)" line="var(--green)" onclick={playGames.onsignin}>SIGN IN</Button>
            {/if}
        </div>
    {/if}

    {#if oninstall}
        <!-- Green already, so it is selected in the accent -->
        <div class="install">
            <Button ink="var(--green)" line="var(--green)" onclick={oninstall}>INSTALL</Button>
        </div>
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
        <Button
            size="large"
            color="var(--yellow)"
            ink="var(--yellow)"
            onclick={onstart}
            {@attach (node) => node.focus()}>START GAME</Button
        >
        <!-- Locked it can still be selected and pressed, and then tells what opens it -->
        <div class="slot">
            <Button
                size="large"
                color="var(--red)"
                ink="var(--red)"
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
            </Button>
            {#if !hardcoreUnlocked}
                <span id="hardcore-hint" class="hint" class:shown={lockHint}>CLEAR LEVEL {HARDCORE_UNLOCK_SCORE}</span>
            {/if}
        </div>
    </div>

    <div class="buttons">
        <Button size="large" color="var(--blue)" onclick={onstats}>STATS</Button>
        <Button size="large" color="var(--red)" onclick={onsetup}>SETTINGS</Button>
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

    /* Both hi-scores side by side reach under INSTALL or Play Games on narrow screens, there they move down below it */
    @media (max-width: 459px) {
        .crowded .hiscore {
            margin-top: 48px;
        }
    }

    /* The two ways to play, the same size whether HARDCORE is locked or not */
    .play {
        --button-flex: none;
        --button-width: max(240px, calc(30 * var(--unit)));
        --button-height: max(56px, calc(6.4 * var(--unit)));
        --button-font: max(13px, calc(1.6 * var(--unit)));
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
        font-size: var(--text-tiny);
        color: var(--text-dim);
        visibility: hidden;
    }

    .hint.shown {
        visibility: visible;
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
        --button-flex: 0 1 180px;
        --button-height: 52px;
        --button-font: var(--text-small);
        margin-top: auto;
        width: calc(100% - 80px);
        display: flex;
        justify-content: center;
        gap: 16px;
    }

    /* In the browser and on phones in landscape all four buttons have the same size */
    @media (max-height: 520px), (min-width: 600px) {
        .play,
        .buttons {
            --button-flex: none;
            --button-width: max(200px, calc(24 * var(--unit)));
            --button-height: max(52px, calc(5.8 * var(--unit)));
            --button-font: max(12px, calc(1.3 * var(--unit)));
        }
    }

    /* Small and out of the way in the top right corner */
    .install {
        --button-height: 40px;
        --button-padding: 0 8px;
        position: absolute;
        top: calc(env(safe-area-inset-top) + 16px);
        right: calc(env(safe-area-inset-right) + 16px);
    }

    /* Play Games in the top left corner, across from INSTALL */
    .play-games {
        --button-height: 40px;
        --button-padding: 0 8px;
        position: absolute;
        top: calc(env(safe-area-inset-top) + 16px);
        left: calc(env(safe-area-inset-left) + 16px);
        display: flex;
        gap: 8px;
    }

    .icon {
        width: 20px;
        height: 20px;
        fill: currentColor;
        shape-rendering: crispEdges;
    }
</style>
