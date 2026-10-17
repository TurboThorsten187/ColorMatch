<script lang="ts">
    import { awardById, type AwardId } from "./game/awards.ts";
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
    import {
        clearLevel,
        clearStats,
        EMPTY_STATS,
        finishGame,
        type LevelClear,
        loadStats,
        saveStats,
        type Stats,
        unlockMilestones,
    } from "./game/stats.ts";
    import AwardToast from "./ui/AwardToast.svelte";
    import ChallengeScreen from "./ui/ChallengeScreen.svelte";
    import FeedbackFlash, { type FeedbackKind } from "./ui/FeedbackFlash.svelte";
    import GameOverScreen from "./ui/GameOverScreen.svelte";
    import MenuScreen from "./ui/MenuScreen.svelte";
    import PauseScreen from "./ui/PauseScreen.svelte";
    import SettingsScreen from "./ui/SettingsScreen.svelte";
    import { configureSound, playSound, unlockAudio } from "./ui/sound.ts";
    import SpamPauseScreen from "./ui/SpamPauseScreen.svelte";
    import StatsScreen from "./ui/StatsScreen.svelte";
    import TapHints from "./ui/TapHints.svelte";
    import { delay, enqueue, type ToastQueue, visible } from "./ui/toastQueue.ts";
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
    const initialHighscore = loadHighscore(storage);

    // Game states are immutable, so raw state is enough: reactivity only on reassignment
    let game = $state.raw<GameState>(MENU);
    let now = $state(performance.now());
    let highscore = $state(initialHighscore);
    let newRecord = $state(false);
    let lastAnswer = $state.raw<{ answer: Answer; at: number } | null>(null);
    let feedback = $state.raw<{ kind: FeedbackKind; at: number } | null>(null);
    let lostLevel = $state.raw<PlayingState | null>(null);
    let settings = $state.raw<Settings>(initialSettings);
    let stats = $state.raw<Stats>(unlockMilestones(loadStats(storage), initialHighscore));
    // Awards of the current game, listed on the game over screen
    let gameAwards = $state.raw<readonly AwardId[]>([]);
    let toasts = $state.raw<ToastQueue<AwardId>>([]);
    // Settings and stats screens are reached from the menu and are not part of the game state
    let view = $state<"game" | "settings" | "stats">("game");
    let width = $state(0);
    let height = $state(0);

    // Play time of the current game: the time spent paused does not count
    let gameStartedAt = 0;
    let pausedMs = 0;

    const flash = $derived(lastAnswer && now - lastAnswer.at < FLASH_MS ? lastAnswer.answer : null);
    const showMiss = $derived(
        game.phase === "gameOver" && feedback !== null && feedback.kind !== "hit" && now - feedback.at < MISS_SHOW_MS,
    );
    const toast = $derived(visible(toasts, now));

    function update(next: GameState, time: number): void {
        if (next === game) return;

        if (next.phase === "playing" && (game.phase === "menu" || game.phase === "gameOver")) {
            gameStartedAt = time;
            pausedMs = 0;
            gameAwards = [];
            toasts = [];
        }
        if (game.phase === "paused" && next.phase !== "paused") {
            pausedMs += time - game.pausedAt;
            toasts = delay(toasts, game.pausedAt, time - game.pausedAt);
        }

        const solved =
            (next.phase === "playing" && game.phase === "playing" && next.level > game.level) ||
            (next.phase === "spamPause" && game.phase === "playing");
        if (game.phase === "playing" && solved) {
            feedback = { kind: "hit", at: time };
            playSound("hit");
            const { expected } = game.challenge;
            recordClear(
                {
                    level: game.level,
                    modifiers: game.challenge.modifiers,
                    reactionMs: expected === "true" || expected === "false" ? time - game.startedAt : null,
                },
                time,
            );
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
            stats = finishGame(stats, game.level, time - gameStartedAt - pausedMs);
            saveStats(storage, stats);
        }
        game = next;
    }

    // Saved after every level, so progress survives closing the tab in the middle of a game
    function recordClear(clear: LevelClear, time: number): void {
        const result = clearLevel(stats, clear);
        stats = result.stats;
        saveStats(storage, stats);
        if (result.unlocked.length === 0) return;

        gameAwards = [...gameAwards, ...result.unlocked];
        toasts = enqueue(toasts, result.unlocked, time);
    }

    // Another tab of the game saved something: take it over, so this tab does not overwrite it later
    function onStorage(): void {
        highscore = loadHighscore(storage);
        settings = loadSettings(storage);
        configureSound(settings);
        stats = unlockMilestones(loadStats(storage), highscore);
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
        clearStats(storage);
        highscore = 0;
        settings = DEFAULT_SETTINGS;
        stats = EMPTY_STATS;
        configureSound(DEFAULT_SETTINGS);
        playSound("click");
    }

    function showView(next: typeof view): void {
        view = next;
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

        if (view !== "game") {
            if (event.key === "Escape") showView("game");
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
    // Menu and pause continue on any tap; game over, settings and stats have their own buttons.
    function onPointerdown(event: PointerEvent): void {
        unlockAudio();
        if (event.button !== 0 || game.phase === "gameOver" || view !== "game") return;
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
<svelte:window
    onkeydown={onKeydown}
    onpointerdown={onPointerdown}
    onpointerup={unlockAudio}
    onblur={onLeave}
    onstorage={onStorage}
/>
<svelte:document
    onvisibilitychange={() => {
        if (document.hidden) onLeave();
    }}
/>

<main class="stage" bind:clientWidth={width} bind:clientHeight={height}>
    {#if view === "settings"}
        <SettingsScreen {settings} onchange={changeSettings} onreset={resetAllData} onback={() => showView("game")} />
    {:else if view === "stats"}
        <StatsScreen {stats} {highscore} onback={() => showView("game")} />
    {:else if game.phase === "menu"}
        <MenuScreen {highscore} onstats={() => showView("stats")} onsetup={() => showView("settings")} />
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
            awards={gameAwards}
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

    {#if toast && (game.phase === "playing" || game.phase === "spamPause")}
        {#key toast.at}
            <AwardToast award={awardById(toast.item)} />
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
