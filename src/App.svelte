<script lang="ts">
    import type { Answer } from "./game/challenge.ts";
    import {
        answer,
        confirm,
        type GameState,
        isGameOverLocked,
        MENU,
        pause,
        type PlayingState,
        tick,
        toMenu,
    } from "./game/game.ts";
    import { browserStorage, loadHighscore, saveHighscore } from "./game/highscore.ts";
    import ChallengeScreen from "./ui/ChallengeScreen.svelte";
    import FeedbackFlash, { type FeedbackKind } from "./ui/FeedbackFlash.svelte";
    import GameOverScreen from "./ui/GameOverScreen.svelte";
    import MenuScreen from "./ui/MenuScreen.svelte";
    import PauseScreen from "./ui/PauseScreen.svelte";
    import SpamPauseScreen from "./ui/SpamPauseScreen.svelte";
    import TapHints from "./ui/TapHints.svelte";
    import TopBar from "./ui/TopBar.svelte";

    const ANSWER_KEYS: Readonly<Record<string, Answer | undefined>> = {
        ArrowLeft: "true",
        ArrowRight: "false",
    };
    const FLASH_MS = 150;
    const FEEDBACK_MS = 700;
    // The lost level stays on screen this long before the game over screen appears
    const MISS_SHOW_MS = 700;

    const storage = browserStorage();
    const rng = Math.random;

    // Game states are immutable, so raw state is enough: reactivity only on reassignment
    let game = $state.raw<GameState>(MENU);
    let now = $state(performance.now());
    let highscore = $state(loadHighscore(storage));
    let newRecord = $state(false);
    let lastAnswer = $state.raw<{ answer: Answer; at: number } | null>(null);
    let feedback = $state.raw<{ kind: FeedbackKind; at: number } | null>(null);
    let lostLevel = $state.raw<PlayingState | null>(null);
    let width = $state(0);
    let height = $state(0);

    const flash = $derived(lastAnswer && now - lastAnswer.at < FLASH_MS ? lastAnswer.answer : null);
    const showMiss = $derived(
        game.phase === "gameOver" && feedback !== null && feedback.kind !== "hit" && now - feedback.at < MISS_SHOW_MS,
    );

    function update(next: GameState, time: number): void {
        if (next === game) return;

        const solved =
            (next.phase === "playing" && game.phase === "playing" && next.level > game.level) ||
            (next.phase === "spamPause" && game.phase === "playing");
        if (solved) {
            feedback = { kind: "hit", at: time };
        }
        if (game.phase === "playing" && next.phase === "gameOver") {
            feedback = { kind: time - game.startedAt > game.timeLimit ? "timeout" : "miss", at: time };
            lostLevel = game;
            // Re-read first: another tab may have stored a better score meanwhile
            const best = Math.max(highscore, loadHighscore(storage));
            newRecord = next.score > best;
            saveHighscore(storage, next.score);
            highscore = Math.max(best, next.score);
        }
        game = next;
    }

    $effect(() => {
        let frame = requestAnimationFrame(function loop(time) {
            now = time;
            update(tick(game, time, rng), time);
            frame = requestAnimationFrame(loop);
        });
        return () => cancelAnimationFrame(frame);
    });

    function giveAnswer(input: Answer): void {
        const time = performance.now();
        lastAnswer = { answer: input, at: time };
        update(answer(game, input, time, rng), time);
    }

    function goOn(): void {
        const time = performance.now();
        update(confirm(game, time, rng), time);
    }

    function goToMenu(): void {
        const time = performance.now();
        update(toMenu(game, time), time);
    }

    function onKeydown(event: KeyboardEvent): void {
        // Held keys fire keydown repeatedly, that does not count as a new input
        if (event.repeat) return;

        const input = ANSWER_KEYS[event.key];
        if (input && game.phase === "playing") {
            event.preventDefault();
            giveAnswer(input);
        } else if (event.target instanceof HTMLButtonElement) {
            // A focused button handles Enter itself, e.g. MENU must not retry
            return;
        } else if (event.key === "Enter") {
            goOn();
        } else if (event.key === "Escape") {
            goToMenu();
        }
    }

    // During a level the left half of the screen answers TRUE and the right half FALSE.
    // Menu and pause continue on any tap; game over has its own buttons.
    function onPointerdown(event: PointerEvent): void {
        if (event.button !== 0 || game.phase === "gameOver") return;

        if (game.phase === "playing") {
            giveAnswer(event.clientX < width / 2 ? "true" : "false");
        } else {
            goOn();
        }
    }

    // Leaving the tab or app must not cost the game: the timer stops until the player continues
    function onLeave(): void {
        update(pause(game, performance.now()), performance.now());
    }

    function remainingShare(level: PlayingState, time: number): number {
        return 1 - (time - level.startedAt) / level.timeLimit;
    }
</script>

<svelte:window onkeydown={onKeydown} onpointerdown={onPointerdown} onblur={onLeave} />
<svelte:document
    onvisibilitychange={() => {
        if (document.hidden) onLeave();
    }}
/>

<main class="stage" bind:clientWidth={width} bind:clientHeight={height}>
    {#if game.phase === "menu"}
        <MenuScreen {highscore} />
    {:else if game.phase === "playing"}
        <ChallengeScreen challenge={game.challenge} elapsed={now - game.startedAt} {width} {height} />
        <TopBar level={game.level} {highscore} remaining={remainingShare(game, now)} />
        <TapHints {flash} />
    {:else if showMiss && lostLevel && feedback}
        <!-- The lost level, frozen at the moment it was lost -->
        <ChallengeScreen challenge={lostLevel.challenge} elapsed={feedback.at - lostLevel.startedAt} {width} {height} />
        <TopBar level={lostLevel.level} {highscore} remaining={remainingShare(lostLevel, feedback.at)} />
        <TapHints flash={null} />
    {:else if game.phase === "spamPause"}
        <SpamPauseScreen />
    {:else if game.phase === "paused"}
        <PauseScreen />
    {:else if game.phase === "gameOver"}
        <GameOverScreen
            score={game.score}
            {highscore}
            {newRecord}
            locked={isGameOverLocked(game, now)}
            onretry={goOn}
            onmenu={goToMenu}
        />
    {/if}

    {#if feedback && now - feedback.at < FEEDBACK_MS}
        {#key feedback.at}
            <FeedbackFlash kind={feedback.kind} />
        {/key}
    {/if}

    <div class="scanlines" aria-hidden="true"></div>
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
    }

    /* CRT look */
    .scanlines {
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: repeating-linear-gradient(to bottom, rgb(255 255 255 / 0.05) 0 1px, transparent 1px 3px);
    }
</style>
