import { type GameOverState, type GameState, type PlayingState, reactionMs } from "./game.ts";
import type { Mode } from "./progression.ts";

// What happened between two game states, for everything around the rules: sounds, stats, awards and intro cards
export type GameEvent =
    // START, RETRY or HARDCORE began a game
    | { readonly kind: "started"; readonly mode: Mode }
    // The level was solved; reactionMs is null for levels that ask for no answer
    | { readonly kind: "cleared"; readonly level: PlayingState; readonly reactionMs: number | null }
    // A press of a SPAM! level that is not the last one, counted from 1
    | { readonly kind: "spamTap"; readonly count: number }
    // The SURGE banner appeared
    | { readonly kind: "surge" }
    // A level appeared, the first one of a game or the one after a solved level
    | { readonly kind: "levelBegan"; readonly level: PlayingState }
    | { readonly kind: "lost"; readonly over: GameOverState }
    // The paused game goes on, the pause took `pausedFor` ms from `pausedAt`
    | { readonly kind: "resumed"; readonly pausedAt: number; readonly pausedFor: number }
    // MENU on the game over screen
    | { readonly kind: "menu" };

// The events of a transition from `previous` to `next` at `now`, in the order they happened
export function gameEvents(previous: GameState, next: GameState, now: number): GameEvent[] {
    if (next === previous) return [];
    const events: GameEvent[] = [];

    if (previous.phase === "paused" && next.phase !== "paused") {
        events.push({ kind: "resumed", pausedAt: previous.pausedAt, pausedFor: now - previous.pausedAt });
    }
    if ((previous.phase === "menu" || previous.phase === "gameOver") && next.phase === "playing") {
        events.push({ kind: "started", mode: next.mode });
    }
    if (previous.phase === "playing") {
        const solved =
            (next.phase === "playing" && next.level > previous.level) ||
            next.phase === "spamPause" ||
            next.phase === "surgeBanner";
        if (solved) events.push({ kind: "cleared", level: previous, reactionMs: reactionMs(previous, now) });
        if (next.phase === "playing" && next.level === previous.level && next.spamCount > previous.spamCount) {
            events.push({ kind: "spamTap", count: next.spamCount });
        }
        if (next.phase === "gameOver") events.push({ kind: "lost", over: next });
    }
    // A paused banner or level that goes on is not new
    if (previous.phase !== "paused") {
        if (next.phase === "surgeBanner" && previous.phase !== "surgeBanner") events.push({ kind: "surge" });
        const begins = next.phase === "playing" && (previous.phase !== "playing" || next.level > previous.level);
        if (begins) events.push({ kind: "levelBegan", level: next });
    }
    if (previous.phase === "gameOver" && next.phase === "menu") events.push({ kind: "menu" });
    return events;
}
