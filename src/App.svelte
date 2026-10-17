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
        resume,
        tick,
        toMenu,
    } from "./game/game.ts";
    import { browserStorage, clearHighscore, loadHighscore, saveHighscore } from "./game/highscore.ts";
    import { introById, type IntroId, introsForLevel } from "./game/intros.ts";
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
    import {
        answerPractice,
        clearTutorialProgress,
        currentStep,
        isFinished,
        loadTutorialProgress,
        NEW_PLAYER,
        nextCard,
        saveTutorialProgress,
        tickTutorial,
        TUTORIAL_START,
        type TutorialProgress,
        type TutorialState,
    } from "./game/tutorial.ts";
    import AwardToast from "./ui/AwardToast.svelte";
    import ChallengeScreen from "./ui/ChallengeScreen.svelte";
    import FeedbackFlash, { type FeedbackKind } from "./ui/FeedbackFlash.svelte";
    import GameOverScreen from "./ui/GameOverScreen.svelte";
    import MenuScreen from "./ui/MenuScreen.svelte";
    import ModifierIntroScreen from "./ui/ModifierIntroScreen.svelte";
    import PauseScreen from "./ui/PauseScreen.svelte";
    import SettingsScreen from "./ui/SettingsScreen.svelte";
    import { configureSound, playSound, unlockAudio } from "./ui/sound.ts";
    import SpamPauseScreen from "./ui/SpamPauseScreen.svelte";
    import StatsScreen from "./ui/StatsScreen.svelte";
    import TapHints from "./ui/TapHints.svelte";
    import { delay, enqueue, type ToastQueue, visible } from "./ui/toastQueue.ts";
    import TopBar from "./ui/TopBar.svelte";
    import TutorialScreen from "./ui/TutorialScreen.svelte";

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
    // The second half of a double click on a card button must not answer or skip the next card
    const CARD_INPUT_LOCK_MS = 300;

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
    let progress = $state.raw<TutorialProgress>(loadTutorialProgress(storage));
    // Runs instead of the game while set, the game stays in the menu meanwhile
    let tutorial = $state.raw<TutorialState | null>(null);
    // Cards for modifiers seen for the first time, shown while the new level is paused
    let intros = $state.raw<readonly IntroId[]>([]);
    // Settings and stats screens are reached from the menu and are not part of the game state
    let view = $state<"game" | "settings" | "stats">("game");
    let width = $state(0);
    let height = $state(0);

    // Play time of the current game: the time spent paused does not count
    let gameStartedAt = 0;
    let pausedMs = 0;
    let inputLockedUntil = 0;

    const flash = $derived(lastAnswer && now - lastAnswer.at < FLASH_MS ? lastAnswer.answer : null);
    const showMiss = $derived(
        game.phase === "gameOver" && feedback !== null && feedback.kind !== "hit" && now - feedback.at < MISS_SHOW_MS,
    );
    const toast = $derived(visible(toasts, now));

    function update(next: GameState, time: number): void {
        if (next === game) return;

        // A new level with a modifier never seen before waits paused until its cards are read
        let shown = next;
        const unseen = introsForLevel(game, next, progress.seenIntros);
        if (unseen.length > 0) {
            intros = unseen;
            shown = pause(next, time);
        }

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
        game = shown;
    }

    function changeProgress(next: TutorialProgress): void {
        progress = next;
        saveTutorialProgress(storage, next);
    }

    function startTutorial(): void {
        tutorial = TUTORIAL_START;
        view = "game";
        playSound("click");
    }

    function changeTutorial(next: TutorialState, time: number): void {
        if (next === tutorial) return;
        tutorial = next;
        if (isFinished(next)) finishTutorial(time);
    }

    // Skipped or done: the game starts right away
    function finishTutorial(time: number): void {
        tutorial = null;
        if (!progress.done) changeProgress({ ...progress, done: true });
        update(confirm(game, time, rng), time);
    }

    function skipTutorial(): void {
        const time = performance.now();
        inputLockedUntil = time + CARD_INPUT_LOCK_MS;
        finishTutorial(time);
    }

    function tutorialNext(): void {
        if (!tutorial) return;
        const next = nextCard(tutorial);
        if (next === tutorial) return;
        const time = performance.now();
        inputLockedUntil = time + CARD_INPUT_LOCK_MS;
        playSound("click");
        changeTutorial(next, time);
    }

    function answerTutorial(input: Answer): void {
        if (!tutorial) return;
        const time = performance.now();
        const next = answerPractice(tutorial, input, time);
        if (next === tutorial || !next.result) return;
        lastAnswer = { answer: input, at: time };
        feedback = { kind: next.result.correct ? "hit" : "miss", at: time };
        playSound(next.result.correct ? "hit" : "miss");
        tutorial = next;
    }

    function gotIt(): void {
        const time = performance.now();
        const [current, ...rest] = intros;
        if (!current || time < inputLockedUntil) return;
        inputLockedUntil = time + CARD_INPUT_LOCK_MS;
        changeProgress({ ...progress, seenIntros: [...progress.seenIntros, current] });
        intros = rest;
        playSound("click");
        if (rest.length === 0) update(resume(game, time), time);
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
        progress = loadTutorialProgress(storage);
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
        clearTutorialProgress(storage);
        highscore = 0;
        settings = DEFAULT_SETTINGS;
        stats = EMPTY_STATS;
        progress = NEW_PLAYER;
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
            if (tutorial) changeTutorial(tickTutorial(tutorial, time), time);
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
        // The very first START shows how to play
        if (game.phase === "menu" && !progress.done) {
            startTutorial();
            return;
        }
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
        if (tutorial) {
            onTutorialKey(event, input, tutorial);
            return;
        }
        if (intros.length > 0) {
            // Only GOT IT continues, which handles Enter itself while focused
            if (event.key === "Enter" && !(event.target instanceof HTMLButtonElement)) gotIt();
            return;
        }
        if (input && game.phase === "playing") {
            event.preventDefault();
            giveAnswer(input);
        } else if (event.target instanceof HTMLButtonElement) {
            // A focused button handles Enter itself, e.g. MENU must not retry
            return;
        } else if (event.key === "Enter") {
            // Otherwise the same Enter also presses TRY IT, which the tutorial focuses right away
            event.preventDefault();
            goOn();
        } else if (event.key === "Escape") {
            goToMenu();
        }
    }

    function onTutorialKey(event: KeyboardEvent, input: Answer | undefined, state: TutorialState): void {
        if (input && currentStep(state)?.kind === "try") {
            event.preventDefault();
            answerTutorial(input);
        } else if (event.key === "Escape") {
            // Also while TRY IT has the focus
            skipTutorial();
        } else if (event.target instanceof HTMLButtonElement) {
            return;
        } else if (event.key === "Enter") {
            tutorialNext();
        }
    }

    // During a level the left half of the screen answers TRUE and the right half FALSE.
    // Menu and pause continue on any tap; game over, settings, stats and modifier cards have their own buttons.
    function onPointerdown(event: PointerEvent): void {
        unlockAudio();
        if (event.button !== 0 || game.phase === "gameOver" || view !== "game" || intros.length > 0) return;
        // Buttons handle their own clicks, e.g. SETUP in the menu must not start a game
        if (event.target instanceof Element && event.target.closest("button")) return;
        if (performance.now() < inputLockedUntil) return;

        if (tutorial) {
            if (currentStep(tutorial)?.kind === "try") answerTutorial(event.clientX < width / 2 ? "true" : "false");
            return;
        }
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
        <SettingsScreen
            {settings}
            onchange={changeSettings}
            onreset={resetAllData}
            onreplay={startTutorial}
            onback={() => showView("game")}
        />
    {:else if view === "stats"}
        <StatsScreen {stats} {highscore} onback={() => showView("game")} />
    {:else if tutorial}
        <TutorialScreen {tutorial} {flash} {width} {height} onnext={tutorialNext} onskip={skipTutorial} />
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
    {:else if game.phase === "paused" && intros.length > 0}
        <ModifierIntroScreen intro={introById(intros[0])} level={game.resumeTo.level} ongotit={gotIt} />
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
