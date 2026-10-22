import type { Answer } from "./challenge.ts";
import type { Color } from "./colors.ts";
import { INTROS, type IntroId } from "./intros.ts";
import { field } from "./parse.ts";

// The "+1" or "MISS!" of a practice answer stays this long, input waits meanwhile
export const HIT_PAUSE_MS = 450;
export const MISS_PAUSE_MS = 650;

export interface PracticeWord {
    readonly word: Color;
    readonly color: Color;
}

export const PRACTICE_WORDS: readonly PracticeWord[] = [
    { word: "red", color: "red" },
    { word: "blue", color: "green" },
    { word: "yellow", color: "yellow" },
    { word: "green", color: "purple" },
];

export type TutorialStep =
    { readonly kind: "card"; readonly card: number } | { readonly kind: "try"; readonly practice: number };

export const TUTORIAL_CARDS = 3;

// Every card is followed right away by trying out what it explained
export const TUTORIAL_STEPS: readonly TutorialStep[] = [
    { kind: "card", card: 0 },
    { kind: "try", practice: 0 },
    { kind: "card", card: 1 },
    { kind: "try", practice: 1 },
    { kind: "card", card: 2 },
    { kind: "try", practice: 2 },
    { kind: "try", practice: 3 },
];

export interface TutorialState {
    readonly step: number;
    // Set while the result of a practice answer is shown
    readonly result: { readonly correct: boolean; readonly at: number } | null;
}

export const TUTORIAL_START: TutorialState = { step: 0, result: null };

export function currentStep(state: TutorialState): TutorialStep | null {
    return state.step < TUTORIAL_STEPS.length ? TUTORIAL_STEPS[state.step] : null;
}

export function isFinished(state: TutorialState): boolean {
    return state.step >= TUTORIAL_STEPS.length;
}

export function expectedAnswer(practice: PracticeWord): Answer {
    return practice.word === practice.color ? "true" : "false";
}

export function nextCard(state: TutorialState): TutorialState {
    return currentStep(state)?.kind === "card" ? { step: state.step + 1, result: null } : state;
}

export function answerPractice(state: TutorialState, answer: Answer, now: number): TutorialState {
    const step = currentStep(state);
    if (step?.kind !== "try" || state.result) return state;
    return { ...state, result: { correct: answer === expectedAnswer(PRACTICE_WORDS[step.practice]), at: now } };
}

// A right answer moves on, a wrong one repeats the same word
export function tickTutorial(state: TutorialState, now: number): TutorialState {
    const { result } = state;
    if (!result) return state;
    if (result.correct) return now - result.at >= HIT_PAUSE_MS ? { step: state.step + 1, result: null } : state;
    return now - result.at >= MISS_PAUSE_MS ? { ...state, result: null } : state;
}

export interface TutorialProgress {
    // The how-to-play cards ran once, they only come back through REPLAY in the settings
    readonly done: boolean;
    readonly seenIntros: readonly IntroId[];
}

export const NEW_PLAYER: TutorialProgress = { done: false, seenIntros: [] };

const INTRO_IDS: ReadonlySet<string> = new Set(INTROS.map((intro) => intro.id));

function isIntroId(value: unknown): value is IntroId {
    return typeof value === "string" && INTRO_IDS.has(value);
}

export function parseProgress(stored: unknown): TutorialProgress {
    const seenIntros = field(stored, "seenIntros");
    return {
        done: field(stored, "done") === true,
        seenIntros: Array.isArray(seenIntros) ? [...new Set(seenIntros.filter(isIntroId))] : [],
    };
}
