<script lang="ts">
    import { awardById, type AwardId } from "./game/awards.ts";
    import type { Answer } from "./game/challenge.ts";
    import {
        answer,
        confirm,
        type GameState,
        isGameOverLocked,
        isSpamBang,
        isTooEarly,
        MENU,
        modeOf,
        pause,
        type PlayingState,
        resume,
        SPAM_PRESSES_NEEDED,
        startGame,
        tick,
        toMenu,
        WAIT_SHARE,
    } from "./game/game.ts";
    import {
        browserStorage,
        clearHighscore,
        isHardcoreUnlocked,
        loadHighscore,
        saveHighscore,
    } from "./game/highscore.ts";
    import { introById, type IntroId, introsForLevel } from "./game/intros.ts";
    import {
        answerOn,
        clearSettings,
        DEFAULT_SETTINGS,
        loadSettings,
        saveSettings,
        type Settings,
        type Side,
    } from "./game/settings.ts";
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
    import { isNegative, lowTimeGlow } from "./ui/effects.ts";
    import FeedbackFlash, { type FeedbackKind } from "./ui/FeedbackFlash.svelte";
    import GameOverScreen from "./ui/GameOverScreen.svelte";
    import { canInstall, install } from "./ui/install.svelte.ts";
    import { configurePalette, inkCss } from "./ui/palette.svelte.ts";
    import { LOSS_ANIMATION_MS, SQUASH_AT_MS } from "./ui/lossAnimation.ts";
    import LossScreen from "./ui/LossScreen.svelte";
    import MenuScreen from "./ui/MenuScreen.svelte";
    import ModifierIntroScreen from "./ui/ModifierIntroScreen.svelte";
    import PauseScreen from "./ui/PauseScreen.svelte";
    import SettingsScreen from "./ui/SettingsScreen.svelte";
    import { configureSound, playSound, unlockAudio } from "./ui/sound.ts";
    import SpamPauseScreen from "./ui/SpamPauseScreen.svelte";
    import SurgeBanner from "./ui/SurgeBanner.svelte";
    import StatsScreen from "./ui/StatsScreen.svelte";
    import TapHints from "./ui/TapHints.svelte";
    import { delay, enqueue, type ToastQueue, visible } from "./ui/toastQueue.ts";
    import { type Direction, neighbor } from "./ui/spatialNav.ts";
    import TopBar, { LOW_TIME_SHARE } from "./ui/TopBar.svelte";
    import TutorialScreen from "./ui/TutorialScreen.svelte";

    // The answer of a side depends on FLIP CONTROLS, see answerOn
    const SIDE_KEYS: Readonly<Record<string, Side | undefined>> = {
        ArrowLeft: "left",
        ArrowRight: "right",
        a: "left",
        A: "left",
        d: "right",
        D: "right",
    };
    // Outside of a level, arrow keys and WASD move the selection between the buttons of a screen
    const NAV_KEYS: Readonly<Record<string, Direction | undefined>> = {
        ArrowUp: "up",
        w: "up",
        W: "up",
        ArrowDown: "down",
        s: "down",
        S: "down",
        ArrowLeft: "left",
        a: "left",
        A: "left",
        ArrowRight: "right",
        d: "right",
        D: "right",
    };
    const BACK_KEYS: ReadonlySet<string> = new Set(["Escape", "Backspace"]);
    // What the selection can land on; the volume buttons are left out because the volume bar takes left and right
    const NAVIGABLE = 'button:not(:disabled):not([tabindex="-1"]), [role="slider"]';
    const FLASH_MS = 150;
    // A pressed button gives way this long before it acts
    const BUTTON_PRESS_MS = 120;
    const FEEDBACK_MS = 700;
    // Every tap of a SPAM! level sounds higher than the one before
    const SPAM_STEP_SEMITONES = 2;
    // The second half of a double click on a card button must not answer or skip the next card
    const CARD_INPUT_LOCK_MS = 300;
    // Sounds that start together with the hit of the level before wait until it is over
    const AFTER_HIT_MS = 120;

    const storage = browserStorage();
    const rng = Math.random;
    const initialSettings = loadSettings(storage);
    configureSound(initialSettings);
    configurePalette(initialSettings);
    const initialHighscore = loadHighscore(storage);

    // Game states are immutable, so raw state is enough: reactivity only on reassignment
    let game = $state.raw<GameState>(MENU);
    let now = $state(performance.now());
    let highscore = $state(initialHighscore);
    let hardcoreHighscore = $state(loadHighscore(storage, "hardcore"));
    let newRecord = $state(false);
    let lastAnswer = $state.raw<{ answer: Answer; at: number } | null>(null);
    let feedback = $state.raw<{ kind: FeedbackKind; at: number } | null>(null);
    let loss = $state.raw<{ level: PlayingState; kind: Exclude<FeedbackKind, "hit">; at: number } | null>(null);
    // The solved SPAM! level, shown frozen with its ! lit at the start of the spam pause
    let spamDone = $state.raw<{ level: PlayingState; at: number } | null>(null);
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
    let stage = $state<HTMLElement>();
    // The selected button is highlighted only while playing with the keyboard
    let keyboardMode = $state(false);

    // Play time of the current game: the time spent paused does not count
    let gameStartedAt = 0;
    let pausedMs = 0;
    let inputLockedUntil = 0;
    // Set while a held back click is replayed, so it is not held back again
    let replayingPress = false;
    // The last level that beeped for low time, and the last award whose toast sounded
    let warnedLevel = 0;
    let announcedAward: AwardId | null = null;

    const mode = $derived(modeOf(game));
    // A game shows the highscore of its own mode
    const gameHighscore = $derived(mode === "hardcore" ? hardcoreHighscore : highscore);
    const flash = $derived(lastAnswer && now - lastAnswer.at < FLASH_MS ? lastAnswer.answer : null);
    const showLoss = $derived(game.phase === "gameOver" && loss !== null && now - loss.at < LOSS_ANIMATION_MS);
    // The keys hint only shows on screens with buttons, never while a word waits for an answer
    const showsButtons = $derived.by(() => {
        if (view !== "game") return true;
        if (tutorial) return currentStep(tutorial)?.kind === "card";
        if (game.phase === "gameOver") return !showLoss;
        return game.phase === "menu" || (game.phase === "paused" && intros.length > 0);
    });
    const toast = $derived.by(() => {
        const shown = game.phase === "playing" || game.phase === "spamPause" || game.phase === "surgeBanner";
        return shown ? visible(toasts, now) : null;
    });

    function update(next: GameState, time: number): void {
        if (next === game) return;
        // Inputs are handled between frames: without this, the screen of the new state would be drawn with the clock
        // of the last frame, before the state began, and every "time since" would be negative for a frame
        now = Math.max(now, time);

        // A new level with a modifier never seen before waits paused until its cards are read
        let shown = next;
        const unseen = introsForLevel(game, next, progress.seenIntros);
        if (unseen.length > 0) {
            intros = unseen;
            shown = pause(next, time);
            playSound("intro", { delayMs: AFTER_HIT_MS });
        }

        if (next.phase === "playing" && (game.phase === "menu" || game.phase === "gameOver")) {
            gameStartedAt = time;
            pausedMs = 0;
            gameAwards = [];
            toasts = [];
            warnedLevel = 0;
        }
        if (game.phase === "paused" && next.phase !== "paused") {
            pausedMs += time - game.pausedAt;
            toasts = delay(toasts, game.pausedAt, time - game.pausedAt);
        }

        const solved =
            (next.phase === "playing" && game.phase === "playing" && next.level > game.level) ||
            ((next.phase === "spamPause" || next.phase === "surgeBanner") && game.phase === "playing");
        if (next.phase === "spamPause" && game.phase === "playing") spamDone = { level: game, at: time };
        if (game.phase === "playing" && solved) {
            feedback = { kind: "hit", at: time };
            playSound("hit");
            // Hardcore counts for no award and no stat
            if (game.mode === "normal") {
                const { expected, modifiers } = game.challenge;
                // A WAIT level only asks for a reaction once it says NOW
                const asked = game.startedAt + (modifiers.has("wait") ? game.timeLimit * WAIT_SHARE : 0);
                recordClear(
                    {
                        level: game.level,
                        modifiers,
                        reactionMs: expected === "true" || expected === "false" ? time - asked : null,
                    },
                    time,
                );
            }
        } else if (next.phase === "playing" && game.phase === "playing" && next.spamCount > game.spamCount) {
            playSound("spamTap", { semitones: (next.spamCount - 1) * SPAM_STEP_SEMITONES });
        }
        if (next.phase === "surgeBanner" && game.phase !== "paused") playSound("surge", { delayMs: AFTER_HIT_MS });
        if (game.phase === "menu" || game.phase === "gameOver") {
            // START, RETRY and MENU
            playSound("click");
        }
        if (game.phase === "playing" && next.phase === "gameOver") {
            const kind = time - game.startedAt > game.timeLimit ? "timeout" : isTooEarly(game, time) ? "early" : "miss";
            // The loss animation shows the result, a "+1" of the level before must not stay on top of it
            feedback = null;
            loss = { level: game, kind, at: time };
            // Re-read first: another tab may have stored a better score meanwhile
            const best = Math.max(gameHighscore, loadHighscore(storage, next.mode));
            newRecord = next.score > best;
            saveHighscore(storage, next.score, next.mode);
            if (next.mode === "hardcore") hardcoreHighscore = Math.max(best, next.score);
            else highscore = Math.max(best, next.score);
            playSound(kind === "early" ? "miss" : kind);
            playSound("crt", { delayMs: SQUASH_AT_MS });
            // The jingle belongs to the game over screen, which appears after the loss animation
            playSound(newRecord ? "record" : "gameOver", { delayMs: LOSS_ANIMATION_MS });
            if (next.mode === "normal") {
                stats = finishGame(stats, game.level, time - gameStartedAt - pausedMs);
                saveStats(storage, stats);
            }
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
        hardcoreHighscore = loadHighscore(storage, "hardcore");
        settings = loadSettings(storage);
        configureSound(settings);
        configurePalette(settings);
        stats = unlockMilestones(loadStats(storage), highscore);
        progress = loadTutorialProgress(storage);
    }

    function changeSettings(next: Settings): void {
        settings = next;
        saveSettings(storage, next);
        configureSound(next);
        configurePalette(next);
        playSound("click");
    }

    function resetAllData(): void {
        clearHighscore(storage);
        clearSettings(storage);
        clearStats(storage);
        clearTutorialProgress(storage);
        highscore = 0;
        hardcoreHighscore = 0;
        settings = DEFAULT_SETTINGS;
        stats = EMPTY_STATS;
        progress = NEW_PLAYER;
        configureSound(DEFAULT_SETTINGS);
        configurePalette(DEFAULT_SETTINGS);
        playSound("click");
    }

    function showView(next: typeof view): void {
        view = next;
        playSound("click");
    }

    function installGame(): void {
        playSound("click");
        install().catch((error: unknown) => {
            console.error("Install prompt failed", error);
        });
    }

    $effect(() => {
        let frame = requestAnimationFrame(function loop(time) {
            // Asked for first, so an error in one frame cannot stop the game for good
            frame = requestAnimationFrame(loop);
            // A frame may start before an input that was already applied, the clock never runs backwards
            now = Math.max(now, time);
            if (tutorial) changeTutorial(tickTutorial(tutorial, time), time);
            update(tick(game, time, rng), time);
            soundTimedEvents();
        });
        return () => cancelAnimationFrame(frame);
    });

    // Once per level when the timer turns red, and once per award toast when it appears
    function soundTimedEvents(): void {
        if (game.phase === "playing" && game.level !== warnedLevel && remainingShare(game, now) <= LOW_TIME_SHARE) {
            warnedLevel = game.level;
            playSound("lowTime");
        }
        if (toast && toast.item !== announcedAward) {
            announcedAward = toast.item;
            playSound("award");
        }
    }

    function giveAnswer(input: Answer, event: Event): void {
        const time = pressTime(event);
        lastAnswer = { answer: input, at: time };
        update(answer(game, input, time, rng), time);
    }

    // When the key or finger went down, not when the handler runs a moment later. Falls back to now for
    // events without a usable time stamp.
    function pressTime(event: Event): number {
        const now = performance.now();
        return event.timeStamp > 0 && event.timeStamp <= now ? event.timeStamp : now;
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

    function startHardcore(): void {
        if (game.phase !== "menu" || !isHardcoreUnlocked(highscore)) return;
        const time = performance.now();
        update(startGame(time, rng, "hardcore"), time);
    }

    function goToMenu(): void {
        const time = performance.now();
        update(toMenu(game, time), time);
    }

    function onKeydown(event: KeyboardEvent): void {
        unlockAudio();
        handleKey(event);
        // Afterwards, so the first arrow key only shows the selection
        keyboardMode = true;
    }

    function handleKey(event: KeyboardEvent): void {
        // Held keys fire keydown repeatedly, that does not count as a new input
        if (event.repeat) return;

        if (view !== "game") {
            if (BACK_KEYS.has(event.key)) showView("game");
            else navigate(event);
            return;
        }

        const side = SIDE_KEYS[event.key];
        const input = side ? answerOn(side, settings.flipControls) : undefined;
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
            giveAnswer(input, event);
        } else if (navigate(event)) {
            return;
        } else if (BACK_KEYS.has(event.key)) {
            goToMenu();
        } else if (event.target instanceof HTMLButtonElement) {
            // A focused button handles Enter itself, e.g. MENU must not retry
            return;
        } else if (event.key === "Enter") {
            // Otherwise the same Enter also presses TRY IT, which the tutorial focuses right away
            event.preventDefault();
            goOn();
        }
    }

    // Moves the focus to the nearest button in the pressed direction; returns whether the key was a direction
    function navigate(event: KeyboardEvent): boolean {
        const direction = NAV_KEYS[event.key];
        if (!direction) return false;
        // The volume bar used left or right itself
        if (event.defaultPrevented) return true;
        event.preventDefault();

        const items = stage
            ? [...stage.querySelectorAll<HTMLElement>(NAVIGABLE)].filter((item) => item.getClientRects().length > 0)
            : [];
        const current = items.findIndex((item) => item === document.activeElement);
        // The selection was hidden while playing with mouse or touch: the first key only shows it
        if (current >= 0 && !keyboardMode) return true;
        const next =
            current < 0
                ? 0
                : neighbor(
                      items.map((item) => item.getBoundingClientRect()),
                      current,
                      direction,
                  );
        const target = next === null ? undefined : items[next];
        if (!target) return true;
        target.focus();
        playSound("move");
        return true;
    }

    function onTutorialKey(event: KeyboardEvent, input: Answer | undefined, state: TutorialState): void {
        if (input && currentStep(state)?.kind === "try") {
            event.preventDefault();
            answerTutorial(input);
        } else if (BACK_KEYS.has(event.key)) {
            // Also while TRY IT has the focus
            skipTutorial();
        } else if (navigate(event)) {
            return;
        } else if (event.target instanceof HTMLButtonElement) {
            return;
        } else if (event.key === "Enter") {
            tutorialNext();
        }
    }

    // During a level the left half of the screen answers TRUE and the right half FALSE, or the other way round with
    // FLIP CONTROLS.
    // Menu and pause continue on any tap; game over, settings, stats and modifier cards have their own buttons.
    function onPointerdown(event: PointerEvent): void {
        unlockAudio();
        keyboardMode = false;
        if (event.button !== 0 || game.phase === "gameOver" || view !== "game" || intros.length > 0) return;
        // Buttons handle their own clicks, e.g. SETTINGS in the menu must not start a game
        if (event.target instanceof Element && event.target.closest("button")) return;
        if (performance.now() < inputLockedUntil) return;

        const input = answerOn(event.clientX < width / 2 ? "left" : "right", settings.flipControls);
        if (tutorial) {
            if (currentStep(tutorial)?.kind === "try") answerTutorial(input);
            return;
        }
        if (game.phase === "playing") {
            giveAnswer(input, event);
        } else {
            goOn();
        }
    }

    // A press of a button, by tap, click, Enter or Space, is held back until the button has given way, so the press
    // can be seen even when the screen changes right after. Buttons with their own press feedback opt out with
    // data-no-press.
    function pressButton(event: MouseEvent): void {
        if (replayingPress || !(event.target instanceof Element)) return;
        const button = event.target.closest("button");
        if (!button || button.dataset.noPress !== undefined) return;
        event.stopPropagation();
        if (button.dataset.press !== undefined) return;
        button.dataset.press = "";
        setTimeout(() => {
            delete button.dataset.press;
            if (!button.isConnected || button.disabled) return;
            replayingPress = true;
            try {
                button.click();
            } finally {
                replayingPress = false;
            }
        }, BUTTON_PRESS_MS);
    }

    // With a mouse the button under it is selected like with the keys, and the arrow keys go on from there. Only a
    // moved mouse counts: a new screen appearing under a resting one must not take the selection away from the keys.
    function selectHovered(event: PointerEvent): void {
        if (event.pointerType !== "mouse" || (event.movementX === 0 && event.movementY === 0)) return;
        if (!(event.target instanceof Element)) return;
        const item = event.target.closest<HTMLElement>(NAVIGABLE);
        if (!item || !stage?.contains(item)) return;
        if (item !== document.activeElement) item.focus({ preventScroll: true });
        keyboardMode = true;
    }

    // Leaving the tab or app must not cost the game: the timer stops until the player continues
    function onLeave(): void {
        update(pause(game, performance.now()), performance.now());
    }

    function remainingShare(level: PlayingState, time: number): number {
        return 1 - (time - level.startedAt) / level.timeLimit;
    }

    // NEGATIVE turns the whole level into its photo negative for a while, the timer and the hints too
    function isNegativeAt(level: PlayingState, time: number): boolean {
        return level.challenge.modifiers.has("negative") && isNegative(time - level.startedAt, level.timeLimit);
    }
</script>

<!-- A level at the given time: the playing level, or the solved SPAM! level frozen at its last press -->
{#snippet playfield(level: PlayingState, time: number, spamCount: number)}
    <div class="playfield" style:filter={isNegativeAt(level, time) ? "invert(1)" : null}>
        <ChallengeScreen
            challenge={level.challenge}
            elapsed={time - level.startedAt}
            timeLimit={level.timeLimit}
            {spamCount}
            {width}
            {height}
            colorblind={settings.colorblind}
        />
        <TopBar
            level={level.level}
            highscore={gameHighscore}
            remaining={remainingShare(level, time)}
            countUp={level.challenge.modifiers.has("countUp")}
        />
        <TapHints {flash} double={level.challenge.modifiers.has("doubleTap")} flipControls={settings.flipControls} />
    </div>
    <!-- Outside of the playfield, so NEGATIVE does not turn it cyan -->
    <div
        class="low-time"
        style:opacity={lowTimeGlow(remainingShare(level, time), LOW_TIME_SHARE)}
        aria-hidden="true"
    ></div>
{/snippet}

<!-- On touch screens only pointerup counts as a gesture that may start audio -->
<svelte:window
    onkeydown={onKeydown}
    onpointerdown={onPointerdown}
    onpointermove={selectHovered}
    onpointerup={unlockAudio}
    onblur={onLeave}
    onstorage={onStorage}
/>
<svelte:document
    onvisibilitychange={() => {
        if (document.hidden) onLeave();
    }}
/>

<main
    class="stage"
    class:keys={keyboardMode}
    class:hardcore={mode === "hardcore"}
    style:--red={inkCss("red")}
    style:--green={inkCss("green")}
    style:--blue={inkCss("blue")}
    style:--yellow={inkCss("yellow")}
    style:--purple={inkCss("purple")}
    style:--cyan={inkCss("cyan")}
    onclickcapture={pressButton}
    bind:this={stage}
    bind:clientWidth={width}
    bind:clientHeight={height}
>
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
        <TutorialScreen
            {tutorial}
            {flash}
            {width}
            {height}
            colorblind={settings.colorblind}
            flipControls={settings.flipControls}
            onnext={tutorialNext}
            onskip={skipTutorial}
        />
    {:else if game.phase === "menu"}
        <MenuScreen
            {highscore}
            {hardcoreHighscore}
            hardcoreUnlocked={isHardcoreUnlocked(highscore)}
            flipControls={settings.flipControls}
            onstart={goOn}
            onhardcore={startHardcore}
            onstats={() => showView("stats")}
            onsetup={() => showView("settings")}
            oninstall={canInstall() ? installGame : undefined}
        />
    {:else if game.phase === "playing"}
        {@render playfield(game, now, game.spamCount)}
    {:else if showLoss && loss}
        <LossScreen
            level={loss.level}
            lostAt={loss.at}
            kind={loss.kind}
            elapsed={now - loss.at}
            highscore={gameHighscore}
            {width}
            {height}
            colorblind={settings.colorblind}
            flipControls={settings.flipControls}
        />
    {:else if game.phase === "spamPause" && spamDone && isSpamBang(game, now)}
        {@render playfield(spamDone.level, spamDone.at, SPAM_PRESSES_NEEDED)}
    {:else if game.phase === "spamPause"}
        <SpamPauseScreen />
    {:else if game.phase === "surgeBanner"}
        <SurgeBanner />
    {:else if game.phase === "paused" && intros.length > 0}
        <ModifierIntroScreen
            intro={introById(intros[0])}
            level={game.resumeTo.level}
            elapsed={now - game.pausedAt}
            colorblind={settings.colorblind}
            flipControls={settings.flipControls}
            ongotit={gotIt}
        />
    {:else if game.phase === "paused"}
        <PauseScreen />
    {:else if game.phase === "gameOver"}
        <GameOverScreen
            score={game.score}
            highscore={gameHighscore}
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

    {#if toast}
        {#key toast.at}
            <AwardToast award={awardById(toast.item)} />
        {/key}
    {/if}

    {#if keyboardMode && showsButtons}
        <div class="key-help" aria-hidden="true">ARROWS SELECT · ENTER OK · ESC BACK</div>
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
        /* The highlight color of every screen a game shows, red in hardcore */
        --accent: var(--yellow);
    }

    .stage.hardcore {
        --accent: var(--red);
    }

    /* Screens focus a button on their own so Enter works at once; the browser's focus ring would show that before
       any key is pressed, the selection only appears as the colors below */
    .stage :global(:is(button, [role="slider"]):focus) {
        outline: none;
    }

    /* A button sets --button-color to be selected in it; without one it is selected in the accent */
    .stage :global(:is(button, [role="slider"])) {
        --select: var(--button-color, var(--accent));
    }

    /* The selection, moved with the arrow keys, WASD, Tab or the mouse, and a pressed button: border and text take
       the button's color */
    .stage.keys :global(:is(button, [role="slider"]):focus),
    .stage :global(button[data-press]) {
        border-color: var(--select);
        color: var(--select);
    }

    /* scale, not transform, which some buttons use to position themselves */
    .stage :global(button[data-press]) {
        scale: 0.92;
    }

    /* A black strip, so scrolled content passes under it; screens keep 40 px free at the bottom for it */
    .key-help {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        padding: 12px 0 calc(env(safe-area-inset-bottom) + 12px);
        background: #000;
        text-align: center;
        font-size: 10px;
        color: #777;
        pointer-events: none;
    }

    /* Short screens have no room below their buttons */
    @media (max-height: 520px) {
        .key-help {
            display: none;
        }
    }

    .playfield {
        position: absolute;
        inset: 0;
    }

    /* LOW TIME: a glowing red frame, its opacity comes from lowTimeGlow */
    .low-time {
        position: absolute;
        inset: 0;
        pointer-events: none;
        box-shadow:
            inset 0 0 0 6px var(--red),
            inset 0 0 28px 10px color-mix(in srgb, var(--red) 75%, transparent);
    }

    /* CRT look */
    .scanlines {
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: repeating-linear-gradient(to bottom, rgb(255 255 255 / 0.05) 0 1px, transparent 1px 3px);
    }
</style>
