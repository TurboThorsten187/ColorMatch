import { type Highscores, NO_HIGHSCORES, parseHighscores } from "./highscore.ts";
import { field } from "./parse.ts";
import { DEFAULT_SETTINGS, parseSettings, type Settings } from "./settings.ts";
import { EMPTY_STATS, parseStats, type Stats } from "./stats.ts";
import { NEW_PLAYER, parseProgress, type TutorialProgress } from "./tutorial.ts";

// Everything the game keeps between visits, stored as one JSON object together with SAVE_VERSION
export interface SaveData {
    readonly settings: Settings;
    readonly highscores: Highscores;
    readonly stats: Stats;
    readonly progress: TutorialProgress;
}

// A change of the format that older saves cannot be read with bumps this. parseSave then has to turn saves of the
// older versions into the new format, or they start over.
export const SAVE_VERSION = 1;

export const NEW_SAVE: SaveData = {
    settings: DEFAULT_SETTINGS,
    highscores: NO_HIGHSCORES,
    stats: EMPTY_STATS,
    progress: NEW_PLAYER,
};

// Parsed JSON of a save; every part that is missing or broken falls back on its own
export function parseSave(stored: unknown): SaveData {
    if (field(stored, "version") !== SAVE_VERSION) return NEW_SAVE;
    return {
        settings: parseSettings(field(stored, "settings")),
        highscores: parseHighscores(field(stored, "highscores")),
        stats: parseStats(field(stored, "stats")),
        progress: parseProgress(field(stored, "progress")),
    };
}

export function serializeSave(save: SaveData): string {
    return JSON.stringify({ version: SAVE_VERSION, ...save });
}
