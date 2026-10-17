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
    import { browserStorage, clearHighscore, loadHighscore, saveHighscore } from "./game/highscore.ts";
    import { clearSettings, DEFAULT_SETTINGS, loadSettings, saveSettings, type Settings } from "./game/settings.ts";
    import ChallengeScreen from "./ui/ChallengeScreen.svelte";
    import FeedbackFlash, { type FeedbackKind } from "./ui/FeedbackFlash.svelte";
    import GameOverScreen from "./ui/GameOverScreen.svelte";
    import MenuScreen from "./ui/MenuScreen.svelte";
    import PauseScreen from "./ui/PauseScreen.svelte";
    import SettingsScreen from "./ui/SettingsScreen.svelte";
    import { configureSound, playSound, unlockAudio } from "./ui/sound.ts";
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
    // Every tap of a SPAM! level sounds higher than the one before
    const SPAM_STEP_SEMITONES = 2;

    const storage = browserStorage();
    const rng = Math.random;
    const initialSettings = loadSettings(storage);
    configureSound(initialSettings);

    // Game states are immutable, so raw state is enough: reactivity only on reassignment
    let game = $state.raw<GameState>(MENU);
    let now = $state(performance.now());
    let highscore = $state(loadHighscore(storage));
    let newRecord = $state(false);
    let lastAnswer = $state.raw<{ answer: Answer; at: number } | null>(null);
    let feedback = $state.raw<{ kind: FeedbackKind; at: number } | null>(null);
    let lostLevel = $state.raw<PlayingState | null>(null);
    let settings = $state.raw<Settings>(initialSettings);
    // The settings screen is reached from the menu and is not part of the game state
    let view = $state<"game" | "settings">("game");
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
            playSound("hit");
        } else if (next.phase === "playing" && game.phase === "playing" && next.spamCount > game.spamCount) {
            playSound("spamTap", { rate: 2 ** (((next.spamCount - 1) * SPAM_STEP_SEMITONES) / 12) });
        }
        if (game.phase === "menu" || game.phase === "gameOver") {
            // START, RETRY and MENU
            playSound("click");
        }
        if (game.phase === "playing" && next.phase === "gameOver") {
            const kind = time - game.startedAt > game.timeLimit ? "timeout" : "miss";
            feedback = { kind, at: time };
            lostLevel = game;
            // Re-read first: another tab may have stored a better score meanwhile
            const best = Math.max(highscore, loadHighscore(storage));
            newRecord = next.score > best;
            saveHighscore(storage, next.score);
            highscore = Math.max(best, next.score);
            playSound(kind);
            // The jingle belongs to the game over screen, which appears after the lost level
            playSound(newRecord ? "record" : "gameOver", { delayMs: MISS_SHOW_MS });
        }
        game = next;
    }

    function changeSettings(next: Settings): void {
        settings = next;
        saveSettings(storage, next);
        configureSound(next);
        playSound("click");
    }

    function resetAllData(): void {
        clearHighscore(storage);
        clearSettings(storage);
        highscore = 0;
        settings = DEFAULT_SETTINGS;
        configureSound(DEFAULT_SETTINGS);
        playSound("click");
    }

    function openSettings(): void {
        view = "settings";
        playSound("click");
    }

    function closeSettings(): void {
        view = "game";
        playSound("click");
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
        unlockAudio();
        // Held keys fire keydown repeatedly, that does not count as a new input
        if (event.repeat) return;

        if (view === "settings") {
            if (event.key === "Escape") closeSettings();
            return;
        }

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
    // Menu and pause continue on any tap; game over and settings have their own buttons.
    function onPointerdown(event: PointerEvent): void {
        unlockAudio();
        if (event.button !== 0 || game.phase === "gameOver" || view === "settings") return;
        // Buttons handle their own clicks, e.g. SETUP in the menu must not start a game
        if (event.target instanceof Element && event.target.closest("button")) return;

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

<!-- On touch screens only pointerup counts as a gesture that may start audio -->
<svelte:window onkeydown={onKeydown} onpointerdown={onPointerdown} onpointerup={unlockAudio} onblur={onLeave} />
<svelte:document
    onvisibilitychange={() => {
        if (document.hidden) onLeave();
    }}
/>

<main class="stage" bind:clientWidth={width} bind:clientHeight={height}>
    {#if view === "settings"}
        <SettingsScreen {settings} onchange={changeSettings} onreset={resetAllData} onback={closeSettings} />
    {:else if game.phase === "menu"}
        <MenuScreen {highscore} onsetup={openSettings} />
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

    {#if settings.scanlines}
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
    }

    /* CRT look */
    .scanlines {
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: repeating-linear-gradient(to bottom, rgb(255 255 255 / 0.05) 0 1px, transparent 1px 3px);
    }
</style>
