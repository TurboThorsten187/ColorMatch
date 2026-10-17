import { describe, expect, it } from "vitest";
import { type GameState, MENU, pause, type PlayingState } from "./game.ts";
import { INTROS, introsForLevel, newIntros } from "./intros.ts";
import { MODIFIER_GROUPS, type ModifierId } from "./modifiers.ts";
import { blockedStorage, memoryStorage } from "./testStorage.ts";
import {
    answerPractice,
    clearTutorialProgress,
    currentStep,
    expectedAnswer,
    HIT_PAUSE_MS,
    isFinished,
    loadTutorialProgress,
    MISS_PAUSE_MS,
    NEW_PLAYER,
    nextCard,
    PRACTICE_WORDS,
    saveTutorialProgress,
    tickTutorial,
    TUTORIAL_START,
    TUTORIAL_STEPS,
    type TutorialState,
} from "./tutorial.ts";

function playing(level: number, modifiers: ModifierId[]): PlayingState {
    return {
        phase: "playing",
        level,
        challenge: {
            word: "red",
            color: "red",
            modifiers: new Set(modifiers),
            expected: "true",
            background: null,
            rotationDeg: 0,
            seed: 0,
        },
        startedAt: 0,
        timeLimit: 3000,
        spamCount: 0,
        curriculum: MODIFIER_GROUPS.map((group) => group.id),
    };
}

function solve(state: TutorialState, now: number): TutorialState {
    const step = currentStep(state);
    if (step?.kind === "card") return nextCard(state);
    if (step?.kind !== "try") throw new Error("Tutorial already finished");
    const answered = answerPractice(state, expectedAnswer(PRACTICE_WORDS[step.practice]), now);
    return tickTutorial(answered, now + HIT_PAUSE_MS);
}

describe("tutorial", () => {
    it("follows every card with trying it out and ends after all steps", () => {
        let state = TUTORIAL_START;
        for (let i = 0; i < TUTORIAL_STEPS.length; i++) {
            expect(isFinished(state)).toBe(false);
            state = solve(state, i * 1000);
        }

        expect(isFinished(state)).toBe(true);
        expect(currentStep(state)).toBeNull();
        expect(TUTORIAL_STEPS.map((step) => step.kind)).toEqual(["card", "try", "card", "try", "card", "try", "try"]);
    });

    it("practices both answers", () => {
        expect(PRACTICE_WORDS.map(expectedAnswer)).toEqual(["true", "false", "true", "false"]);
    });

    it("repeats a word after a wrong answer", () => {
        const onTry = nextCard(TUTORIAL_START);
        const missed = answerPractice(onTry, "false", 1000);

        expect(missed.result).toEqual({ correct: false, at: 1000 });
        expect(tickTutorial(missed, 1000 + MISS_PAUSE_MS - 1)).toBe(missed);
        expect(tickTutorial(missed, 1000 + MISS_PAUSE_MS)).toEqual(onTry);
    });

    it("moves on once the +1 was shown", () => {
        const onTry = nextCard(TUTORIAL_START);
        const hit = answerPractice(onTry, "true", 1000);

        expect(tickTutorial(hit, 1000 + HIT_PAUSE_MS - 1)).toBe(hit);
        expect(tickTutorial(hit, 1000 + HIT_PAUSE_MS)).toEqual({ step: 2, result: null });
    });

    it("ignores input that does not fit the step", () => {
        const onTry = nextCard(TUTORIAL_START);
        const hit = answerPractice(onTry, "true", 1000);

        expect(answerPractice(TUTORIAL_START, "true", 0)).toBe(TUTORIAL_START);
        expect(nextCard(onTry)).toBe(onTry);
        expect(answerPractice(hit, "false", 1100)).toBe(hit);
    });
});

describe("modifier intros", () => {
    it("are needed once per modifier group, in list order", () => {
        const level = new Set(["rotation", "mirrorHorizontal", "mirrorVertical"] as const);

        expect(newIntros(level, [])).toEqual(["mirror", "rotation"]);
        expect(newIntros(level, ["mirror"])).toEqual(["rotation"]);
        expect(newIntros(new Set(), [])).toEqual([]);
    });

    it("cover every modifier group exactly once", () => {
        expect(INTROS.map((intro) => intro.id).sort()).toEqual(MODIFIER_GROUPS.map((group) => group.id).sort());
    });

    it("are due when a level begins", () => {
        const blurred = playing(6, ["blur"]);

        expect(introsForLevel(MENU, playing(1, ["mirrorVertical"]), [])).toEqual(["mirror"]);
        expect(introsForLevel(playing(5, []), blurred, [])).toEqual(["blur"]);
        const spamPause: GameState = { phase: "spamPause", level: 5, resumeAt: 0, curriculum: [], groups: ["spam"] };

        expect(introsForLevel(spamPause, blurred, [])).toEqual(["blur"]);
        expect(introsForLevel(playing(5, []), blurred, ["blur"])).toEqual([]);
    });

    it("are not due while a level goes on", () => {
        const spam = playing(15, ["spam"]);

        expect(introsForLevel(spam, { ...spam, spamCount: 1 }, [])).toEqual([]);
        expect(introsForLevel(pause(spam, 100), spam, [])).toEqual([]);
        expect(introsForLevel(spam, pause(spam, 100), [])).toEqual([]);
    });
});

describe("tutorial progress", () => {
    it("loads what was saved", () => {
        const storage = memoryStorage();
        saveTutorialProgress(storage, { done: true, seenIntros: ["spam", "blur"] });

        expect(loadTutorialProgress(storage)).toEqual({ done: true, seenIntros: ["spam", "blur"] });
    });

    it("drops invalid values", () => {
        const storage = memoryStorage();
        storage.setItem("colormatch_tutorial", JSON.stringify({ done: "yes", seenIntros: ["spam", "spam", "x", 3] }));

        expect(loadTutorialProgress(storage)).toEqual({ done: false, seenIntros: ["spam"] });
    });

    it("starts over when cleared, broken or blocked", () => {
        const storage = memoryStorage();
        saveTutorialProgress(storage, { done: true, seenIntros: ["spam"] });
        clearTutorialProgress(storage);

        expect(loadTutorialProgress(storage)).toEqual(NEW_PLAYER);
        storage.setItem("colormatch_tutorial", "{broken");
        expect(loadTutorialProgress(storage)).toEqual(NEW_PLAYER);
        expect(loadTutorialProgress(blockedStorage)).toEqual(NEW_PLAYER);
        expect(() => saveTutorialProgress(blockedStorage, NEW_PLAYER)).not.toThrow();
        expect(() => clearTutorialProgress(blockedStorage)).not.toThrow();
    });
});
