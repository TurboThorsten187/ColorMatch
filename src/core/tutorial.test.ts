import { describe, expect, it } from "vitest";
import { INTROS, newIntros } from "./intros.ts";
import { MODIFIER_GROUPS } from "./modifiers.ts";
import {
    answerPractice,
    currentStep,
    expectedAnswer,
    HIT_PAUSE_MS,
    isFinished,
    MISS_PAUSE_MS,
    NEW_PLAYER,
    nextCard,
    parseProgress,
    PRACTICE_WORDS,
    tickTutorial,
    TUTORIAL_START,
    TUTORIAL_STEPS,
    type TutorialState,
} from "./tutorial.ts";

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
});

describe("tutorial progress", () => {
    it("reads what was saved", () => {
        expect(parseProgress({ done: true, seenIntros: ["spam", "blur"] })).toEqual({
            done: true,
            seenIntros: ["spam", "blur"],
        });
    });

    it("drops invalid values", () => {
        expect(parseProgress({ done: "yes", seenIntros: ["spam", "spam", "x", 3] })).toEqual({
            done: false,
            seenIntros: ["spam"],
        });
    });

    it("starts over for anything that is not progress", () => {
        for (const stored of [undefined, null, 42, "text", []]) {
            expect(parseProgress(stored)).toEqual(NEW_PLAYER);
        }
    });
});
