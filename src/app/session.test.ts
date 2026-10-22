import { describe, expect, it } from "vitest";
import { HARDCORE_UNLOCK_SCORE } from "@/core/balance.ts";
import { seededRng } from "@/core/random.ts";
import { NEW_SAVE } from "@/core/save.ts";
import type { Settings } from "@/core/settings.ts";
import { loadSave, type KeyValueStore, writeSave } from "@/platform/storage.ts";
import { memoryStorage } from "@/platform/testStorage.ts";
import { CARD_INPUT_LOCK_MS, Session, type SessionEvent } from "./session.svelte.ts";

function setup(storage: KeyValueStore = memoryStorage()) {
    let time = 1000;
    const events: SessionEvent[] = [];
    const settings: Settings[] = [];
    const session = new Session({
        storage,
        rng: seededRng(5),
        clock: () => time,
        onEvent: (event) => events.push(event),
        onSettings: (next) => settings.push(next),
    });
    return {
        session,
        storage,
        events,
        settings,
        kinds: () => events.map((event) => event.kind),
        // Lets time pass, frame by frame
        wait(ms: number) {
            const end = time + ms;
            while (time < end) {
                time = Math.min(end, time + 16);
                session.frame(time);
            }
        },
        // Answers the running level right, or wrong
        answer(right = true) {
            const { game } = session;
            if (game.phase !== "playing") throw new Error(`No level to answer: ${game.phase}`);
            const left = (game.challenge.expected === "true") === right;
            session.side(left ? "left" : "right", time);
        },
        // Skips the tutorial and waits until taps count again
        start() {
            session.goOn();
            session.skipTutorial();
            this.wait(CARD_INPUT_LOCK_MS);
        },
        // Clears levels, reading every modifier card on the way, until `level` is playing
        playTo(level: number) {
            while (session.game.phase !== "playing" || session.game.level < level) {
                if (session.intros.length > 0) {
                    session.gotIt();
                    this.wait(CARD_INPUT_LOCK_MS);
                } else {
                    this.answer();
                }
            }
        },
    };
}

describe("session", () => {
    it("starts with the saved data and reports its settings", () => {
        const storage = memoryStorage();
        storage.setItem("colormatch_highscore", "12");
        writeSave(storage, { ...NEW_SAVE, settings: { ...NEW_SAVE.settings, volume: 2 } });

        const { session, settings } = setup(storage);

        expect(session.save.settings.volume).toBe(2);
        expect(settings).toEqual([session.save.settings]);
        expect(storage.getItem("colormatch_highscore")).toBeNull();
    });

    it("shows the tutorial on the very first START, and starts the game once it is skipped", () => {
        const { session, storage, kinds } = setup();

        session.goOn();
        expect(session.tutorial).not.toBeNull();
        expect(session.game.phase).toBe("menu");

        session.skipTutorial();
        expect(session.tutorial).toBeNull();
        expect(session.game).toMatchObject({ phase: "playing", level: 1 });
        expect(loadSave(storage).progress.done).toBe(true);
        expect(kinds()).toEqual(["click", "click"]);
    });

    it("answers with the sides and records every cleared level", () => {
        const t = setup();
        t.start();

        t.answer();

        expect(t.session.game).toMatchObject({ phase: "playing", level: 2 });
        expect(t.session.feedback?.kind).toBe("hit");
        expect(t.kinds()).toContain("hit");
        expect(loadSave(t.storage).stats.reactionCount).toBe(1);
    });

    it("swaps the sides with FLIP CONTROLS", () => {
        const t = setup();
        t.session.changeSettings({ ...t.session.settings, flipControls: true });
        t.start();
        const { game } = t.session;
        if (game.phase !== "playing") throw new Error("expected a level");

        t.session.side(game.challenge.expected === "true" ? "right" : "left", 2000);

        expect(t.session.game).toMatchObject({ phase: "playing", level: 2 });
    });

    it("pauses a level with an unseen modifier until its card is read, once", () => {
        const t = setup();
        t.start();
        t.playTo(4);
        t.answer();

        const { game } = t.session;
        expect(game.phase).toBe("paused");
        expect(t.session.intros).toHaveLength(1);
        expect(t.session.answers).toBe(false);
        expect(t.kinds()).toContain("intro");

        const [intro] = t.session.intros;
        t.session.gotIt();
        expect(t.session.game).toMatchObject({ phase: "playing", level: 5 });
        expect(loadSave(t.storage).progress.seenIntros).toEqual([intro]);
    });

    it("ignores taps right after a card, so a double click cannot answer", () => {
        const t = setup();
        t.session.goOn();
        t.session.skipTutorial();

        t.session.tap("left", 1000);
        t.session.tap("right", 1000);
        expect(t.session.game).toMatchObject({ phase: "playing", level: 1 });

        t.wait(CARD_INPUT_LOCK_MS);
        t.session.tap("left", 1400);
        expect(t.session.game.phase === "playing" && t.session.game.level === 1).toBe(false);
    });

    it("ends the game with a new record and counts the play time without pauses", () => {
        const t = setup();
        t.start();
        t.answer();
        t.answer();
        t.wait(500);
        t.session.leave();
        t.wait(60_000);
        t.session.goOn();
        t.wait(500);

        t.answer(false);

        expect(t.session.game).toMatchObject({ phase: "gameOver", score: 2, reason: "miss" });
        expect(t.events.at(-1)).toEqual({ kind: "lost", reason: "miss", newRecord: true });
        const { highscores, stats } = loadSave(t.storage);
        expect(highscores.normal).toBe(2);
        expect(stats.games).toBe(1);
        expect(stats.playMs).toBeGreaterThanOrEqual(1000);
        expect(stats.playMs).toBeLessThan(60_000);
    });

    it("warns once per level when the time runs low", () => {
        const t = setup();
        t.start();

        t.wait(2500);

        expect(t.kinds().filter((kind) => kind === "lowTime")).toHaveLength(1);
    });

    it("unlocks an award with the cleared level and announces its toast once", () => {
        const t = setup();
        t.start();
        t.playTo(11);
        t.wait(100);

        expect(t.session.gameAwards).toContain("level10");
        expect(t.session.toast?.item).toBe("level10");
        expect(t.kinds().filter((kind) => kind === "award")).toHaveLength(1);
    });

    it("plays HARDCORE only once it is unlocked, without stats", () => {
        const storage = memoryStorage();
        const t = setup(storage);
        t.session.startHardcore();
        expect(t.session.game.phase).toBe("menu");

        writeSave(storage, { ...NEW_SAVE, highscores: { normal: HARDCORE_UNLOCK_SCORE, hardcore: 0 } });
        t.session.reload();
        t.session.startHardcore();
        t.wait(CARD_INPUT_LOCK_MS);
        while (t.session.intros.length > 0) {
            t.session.gotIt();
            t.wait(CARD_INPUT_LOCK_MS);
        }
        expect(t.session.mode).toBe("hardcore");
        t.answer(false);

        expect(t.session.game).toMatchObject({ phase: "gameOver", mode: "hardcore" });
        expect(loadSave(storage).stats).toEqual(NEW_SAVE.stats);
    });

    it("goes back from the other screens and out of the tutorial", () => {
        const t = setup();
        t.session.showView("settings");
        t.session.back();
        expect(t.session.view).toBe("game");

        t.session.goOn();
        t.session.back();
        expect(t.session.tutorial).toBeNull();
        expect(t.session.game.phase).toBe("playing");
    });

    it("saves the settings and forgets everything on reset", () => {
        const t = setup();
        const quiet = { ...t.session.settings, sound: false };

        t.session.changeSettings(quiet);
        expect(loadSave(t.storage).settings).toEqual(quiet);
        expect(t.settings.at(-1)).toEqual(quiet);

        t.session.resetAll();
        expect(t.session.save).toEqual(NEW_SAVE);
        expect(loadSave(t.storage)).toEqual(NEW_SAVE);
        expect(t.settings.at(-1)).toEqual(NEW_SAVE.settings);
    });
});
