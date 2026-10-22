import type { AwardId } from "@/core/awards.ts";
import type { Answer } from "@/core/challenge.ts";
import { type GameEvent, gameEvents } from "@/core/events.ts";
import {
    answer,
    confirm,
    type GameOverState,
    type GameState,
    LOW_TIME_SHARE,
    type LossReason,
    MENU,
    modeOf,
    pause,
    type PlayingState,
    remainingShare,
    resume,
    startGame,
    tick,
    toMenu,
} from "@/core/game.ts";
import { isHardcoreUnlocked } from "@/core/highscore.ts";
import { type IntroId, newIntros } from "@/core/intros.ts";
import type { Mode } from "@/core/progression.ts";
import type { Rng } from "@/core/random.ts";
import { NEW_SAVE, type SaveData } from "@/core/save.ts";
import { answerOn, type Settings, type Side } from "@/core/settings.ts";
import { clearLevel, finishGame } from "@/core/stats.ts";
import {
    answerPractice,
    currentStep,
    isFinished,
    nextCard,
    tickTutorial,
    TUTORIAL_START,
    type TutorialState,
} from "@/core/tutorial.ts";
import { clearSave, type KeyValueStore, loadSave, removeOldSaves, writeSave } from "@/platform/storage.ts";
import { delay, enqueue, type QueuedToast, type ToastQueue, visible } from "./toastQueue.ts";

// What the player hears about, besides what the screens show (ui/sounds.ts)
export type SessionEvent =
    // START, RETRY, MENU, a card, a setting or another screen
    | { readonly kind: "click" }
    // A level or a practice word solved, a practice word missed
    | { readonly kind: "hit" }
    | { readonly kind: "miss" }
    | { readonly kind: "lost"; readonly reason: LossReason; readonly newRecord: boolean }
    | { readonly kind: "spamTap"; readonly count: number }
    | { readonly kind: "surge" }
    // A level waits for the cards of modifiers never seen before
    | { readonly kind: "intro" }
    // The level's time runs low
    | { readonly kind: "lowTime" }
    // An award toast appears
    | { readonly kind: "award" };

// The +1 of a solved level or practice word, or how one was missed
export type Feedback = "hit" | LossReason;

// Settings and stats are reached from the menu and are no part of the game state
export type View = "game" | "settings" | "stats";

export interface SessionOptions {
    readonly storage: KeyValueStore | null;
    readonly rng: Rng;
    // performance.now() in the browser
    readonly clock: () => number;
    readonly onEvent: (event: SessionEvent) => void;
    // The settings changed: at the start, by the player or in another tab
    readonly onSettings: (settings: Settings) => void;
}

// The second half of a double click on a card button must not answer or skip the next card
export const CARD_INPUT_LOCK_MS = 300;

// Everything that happens around the rules of src/core: tutorial, modifier cards, the save, stats and awards, and
// which input does what on which screen. Times are in ms on the clock of `options.clock`.
export class Session {
    // Core states are immutable, so raw state is enough: reactivity only on reassignment
    game = $state.raw<GameState>(MENU);
    // The time of the last frame or input; every screen is drawn on this clock
    now = $state(0);
    save = $state.raw<SaveData>(NEW_SAVE);
    // Runs instead of the game while set, the game stays in the menu meanwhile
    tutorial = $state.raw<TutorialState | null>(null);
    // Cards for modifiers seen for the first time, shown while the new level is paused
    intros = $state.raw<readonly IntroId[]>([]);
    view = $state<View>("game");
    newRecord = $state(false);
    lastAnswer = $state.raw<{ readonly answer: Answer; readonly at: number } | null>(null);
    feedback = $state.raw<{ readonly kind: Feedback; readonly at: number } | null>(null);
    // Awards of the current game, listed on the game over screen
    gameAwards = $state.raw<readonly AwardId[]>([]);
    #toasts = $state.raw<ToastQueue<AwardId>>([]);

    readonly #options: SessionOptions;
    // Play time of the current game: the time spent paused does not count
    #gameStartedAt = 0;
    #pausedMs = 0;
    #inputLockedUntil = 0;
    // The last level that warned of low time, and the last award whose toast was announced
    #warnedLevel = 0;
    #announcedAward: AwardId | null = null;

    constructor(options: SessionOptions) {
        this.#options = options;
        this.now = options.clock();
        removeOldSaves(options.storage);
        this.save = loadSave(options.storage);
        options.onSettings(this.save.settings);
    }

    get settings(): Settings {
        return this.save.settings;
    }

    get mode(): Mode | null {
        return modeOf(this.game);
    }

    // A game shows the highscore of its own mode
    get highscore(): number {
        return this.save.highscores[this.mode ?? "normal"];
    }

    get hardcoreUnlocked(): boolean {
        return isHardcoreUnlocked(this.save.highscores.normal);
    }

    // The award toast shown right now; toasts only show while a game runs
    get toast(): QueuedToast<AwardId> | null {
        const { phase } = this.game;
        return phase === "playing" || phase === "spamPause" || phase === "surgeBanner"
            ? visible(this.#toasts, this.now)
            : null;
    }

    // Whether the left and right keys and screen halves answer right now, instead of moving the selection
    get answers(): boolean {
        if (this.view !== "game") return false;
        if (this.tutorial) return currentStep(this.tutorial)?.kind === "try";
        return this.intros.length === 0 && this.game.phase === "playing";
    }

    // One animation frame at `time`
    frame(time: number): void {
        // A frame may start before an input that was already applied, the clock never runs backwards
        this.now = Math.max(this.now, time);
        if (this.tutorial) this.#changeTutorial(tickTutorial(this.tutorial, time), time);
        this.#apply(tick(this.game, time, this.#options.rng), time);
        this.#timedEvents();
    }

    // A left or right key, pressed at `at`; only call it while `answers`
    side(side: Side, at: number): void {
        const input = answerOn(side, this.settings.flipControls);
        if (this.tutorial) {
            this.#answerPractice(input, at);
            return;
        }
        this.lastAnswer = { answer: input, at };
        this.#apply(answer(this.game, input, at, this.#options.rng), at);
    }

    // A tap or click on the screen outside of the buttons: answers in a level, goes on in the menu and the pause.
    // Game over, settings, stats and modifier cards have buttons for that.
    tap(side: Side, at: number): void {
        if (this.view !== "game" || this.intros.length > 0 || this.game.phase === "gameOver") return;
        if (this.#clock() < this.#inputLockedUntil) return;
        if (this.answers) this.side(side, at);
        else if (!this.tutorial) this.goOn();
    }

    // Enter, unless a focused button handles it
    enter(): void {
        if (this.view !== "game") return;
        if (this.tutorial) this.tutorialNext();
        else if (this.intros.length > 0) this.gotIt();
        else this.goOn();
    }

    // Escape or Backspace
    back(): void {
        if (this.view !== "game") this.showView("game");
        else if (this.tutorial) this.skipTutorial();
        else if (this.intros.length === 0) this.goToMenu();
    }

    // START GAME, RETRY, and continuing from the pause
    goOn(): void {
        // The very first START shows how to play
        if (this.game.phase === "menu" && !this.save.progress.done) {
            this.startTutorial();
            return;
        }
        const time = this.#clock();
        this.#apply(confirm(this.game, time, this.#options.rng, this.settings.colorblind), time);
    }

    startHardcore(): void {
        if (this.game.phase !== "menu" || !this.hardcoreUnlocked) return;
        const time = this.#clock();
        this.#apply(startGame(time, this.#options.rng, "hardcore", this.settings.colorblind), time);
    }

    goToMenu(): void {
        const time = this.#clock();
        this.#apply(toMenu(this.game, time), time);
    }

    // Leaving the tab or app must not cost the game: the timer stops until the player continues
    leave(): void {
        const time = this.#clock();
        this.#apply(pause(this.game, time), time);
    }

    showView(view: View): void {
        this.view = view;
        this.#emit({ kind: "click" });
    }

    startTutorial(): void {
        this.tutorial = TUTORIAL_START;
        this.view = "game";
        this.#emit({ kind: "click" });
    }

    skipTutorial(): void {
        const time = this.#clock();
        this.#inputLockedUntil = time + CARD_INPUT_LOCK_MS;
        this.#finishTutorial(time);
    }

    tutorialNext(): void {
        if (!this.tutorial) return;
        const next = nextCard(this.tutorial);
        if (next === this.tutorial) return;
        const time = this.#clock();
        this.#inputLockedUntil = time + CARD_INPUT_LOCK_MS;
        this.#emit({ kind: "click" });
        this.#changeTutorial(next, time);
    }

    // GOT IT on a modifier card: the next card, or the paused level after the last one
    gotIt(): void {
        const time = this.#clock();
        const [current, ...rest] = this.intros;
        if (!current || time < this.#inputLockedUntil) return;
        this.#inputLockedUntil = time + CARD_INPUT_LOCK_MS;
        const { progress } = this.save;
        this.#changeSave({ ...this.save, progress: { ...progress, seenIntros: [...progress.seenIntros, current] } });
        this.intros = rest;
        this.#emit({ kind: "click" });
        if (rest.length === 0) this.#apply(resume(this.game, time), time);
    }

    changeSettings(settings: Settings): void {
        this.#changeSave({ ...this.save, settings });
        this.#options.onSettings(settings);
        this.#emit({ kind: "click" });
    }

    // HOLD TO RESET: highscores, stats, awards, settings and the tutorial progress
    resetAll(): void {
        clearSave(this.#options.storage);
        this.save = NEW_SAVE;
        this.#options.onSettings(NEW_SAVE.settings);
        this.#emit({ kind: "click" });
    }

    // Another tab of the game saved something: take it over, so this tab does not overwrite it later
    reload(): void {
        this.save = loadSave(this.#options.storage);
        this.#options.onSettings(this.save.settings);
    }

    #clock(): number {
        return this.#options.clock();
    }

    #emit(event: SessionEvent): void {
        this.#options.onEvent(event);
    }

    // Everything is saved at once: on every setting, cleared level, finished game and seen card
    #changeSave(save: SaveData): void {
        this.save = save;
        writeSave(this.#options.storage, save);
    }

    #apply(next: GameState, at: number): void {
        const previous = this.game;
        if (next === previous) return;
        // Inputs are handled between frames: without this, the screen of the new state would be drawn with the clock
        // of the last frame, before the state began, and every "time since" would be negative for a frame
        this.now = Math.max(this.now, at);

        let shown = next;
        for (const event of gameEvents(previous, next, at)) {
            if (event.kind !== "levelBegan") {
                this.#handle(event, at);
                continue;
            }
            // A new level with a modifier never seen before waits paused until its cards are read
            const unseen = newIntros(event.level.challenge.modifiers, this.save.progress.seenIntros);
            if (unseen.length === 0) continue;
            this.intros = unseen;
            shown = pause(next, at);
            this.#emit({ kind: "intro" });
        }
        this.game = shown;
    }

    #handle(event: Exclude<GameEvent, { kind: "levelBegan" }>, at: number): void {
        switch (event.kind) {
            case "started":
                this.#gameStartedAt = at;
                this.#pausedMs = 0;
                this.gameAwards = [];
                this.#toasts = [];
                this.#warnedLevel = 0;
                this.#emit({ kind: "click" });
                return;
            case "menu":
                this.#emit({ kind: "click" });
                return;
            case "resumed":
                this.#pausedMs += event.pausedFor;
                this.#toasts = delay(this.#toasts, event.pausedAt, event.pausedFor);
                return;
            case "cleared":
                this.feedback = { kind: "hit", at };
                this.#emit({ kind: "hit" });
                // Hardcore counts for no award and no stat
                if (event.level.mode === "normal") this.#recordClear(event.level, event.reactionMs, at);
                return;
            case "spamTap":
                this.#emit({ kind: "spamTap", count: event.count });
                return;
            case "surge":
                this.#emit({ kind: "surge" });
                return;
            case "lost":
                this.#finishGame(event.over, at);
                return;
        }
    }

    // Saved after every level, so progress survives closing the tab in the middle of a game
    #recordClear(level: PlayingState, reactionMs: number | null, at: number): void {
        const result = clearLevel(this.save.stats, {
            level: level.level,
            modifiers: level.challenge.modifiers,
            reactionMs,
        });
        this.#changeSave({ ...this.save, stats: result.stats });
        if (result.unlocked.length === 0) return;
        this.gameAwards = [...this.gameAwards, ...result.unlocked];
        this.#toasts = enqueue(this.#toasts, result.unlocked, at);
    }

    #finishGame(over: GameOverState, at: number): void {
        // The loss animation shows the result, a "+1" of the level before must not stay on top of it
        this.feedback = null;
        const { highscores, stats } = this.save;
        // Re-read first: another tab may have stored a better score meanwhile
        const best = Math.max(highscores[over.mode], loadSave(this.#options.storage).highscores[over.mode]);
        this.newRecord = over.score > best;
        this.#changeSave({
            ...this.save,
            highscores: { ...highscores, [over.mode]: Math.max(best, over.score) },
            stats:
                over.mode === "normal"
                    ? finishGame(stats, over.lost.level, at - this.#gameStartedAt - this.#pausedMs)
                    : stats,
        });
        this.#emit({ kind: "lost", reason: over.reason, newRecord: this.newRecord });
    }

    #changeTutorial(next: TutorialState, time: number): void {
        if (next === this.tutorial) return;
        this.tutorial = next;
        if (isFinished(next)) this.#finishTutorial(time);
    }

    // Skipped or done: the game starts right away
    #finishTutorial(time: number): void {
        this.tutorial = null;
        const { progress } = this.save;
        if (!progress.done) this.#changeSave({ ...this.save, progress: { ...progress, done: true } });
        this.#apply(confirm(this.game, time, this.#options.rng, this.settings.colorblind), time);
    }

    #answerPractice(input: Answer, at: number): void {
        if (!this.tutorial) return;
        const next = answerPractice(this.tutorial, input, at);
        if (next === this.tutorial || !next.result) return;
        this.lastAnswer = { answer: input, at };
        this.feedback = { kind: next.result.correct ? "hit" : "miss", at };
        this.#emit({ kind: next.result.correct ? "hit" : "miss" });
        this.tutorial = next;
    }

    // Once per level when the time runs low, and once per award toast when it appears
    #timedEvents(): void {
        const { game, now } = this;
        if (
            game.phase === "playing" &&
            game.level !== this.#warnedLevel &&
            remainingShare(game, now) <= LOW_TIME_SHARE
        ) {
            this.#warnedLevel = game.level;
            this.#emit({ kind: "lowTime" });
        }
        const toast = this.toast;
        if (toast && toast.item !== this.#announcedAward) {
            this.#announcedAward = toast.item;
            this.#emit({ kind: "award" });
        }
    }
}
