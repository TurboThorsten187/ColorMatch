import { field } from "./parse.ts";
import type { Mode } from "./progression.ts";

// Every mode keeps its own highscore
export type Highscores = Readonly<Record<Mode, number>>;

export const NO_HIGHSCORES: Highscores = { normal: 0, hardcore: 0 };

// HARDCORE opens once a normal game has cleared this level, like the LEVEL 50 award
export const HARDCORE_UNLOCK_SCORE = 50;

export function isHardcoreUnlocked(normalHighscore: number): boolean {
    return normalHighscore >= HARDCORE_UNLOCK_SCORE;
}

function score(value: unknown): number {
    return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : 0;
}

export function parseHighscores(stored: unknown): Highscores {
    return { normal: score(field(stored, "normal")), hardcore: score(field(stored, "hardcore")) };
}

// The better score of each mode
export function bestHighscores(a: Highscores, b: Highscores): Highscores {
    return { normal: Math.max(a.normal, b.normal), hardcore: Math.max(a.hardcore, b.hardcore) };
}
