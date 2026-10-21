import type { Answer } from "./challenge.ts";
import type { KeyValueStore } from "./highscore.ts";

const SETTINGS_KEY = "colormatch_settings";

export const VOLUME_STEPS = 8;

export interface Settings {
    readonly sound: boolean;
    // 1 (quietest) to VOLUME_STEPS (loudest)
    readonly volume: number;
    readonly scanlines: boolean;
    // OLD_COLOR_CSS instead of COLOR_CSS, only while the design is reworked
    readonly oldColors: boolean;
    // Shapes instead of colors, see SHAPE_WORDS
    readonly colorblind: boolean;
    // FALSE on the left and TRUE on the right: screen halves, arrow keys and A / D
    readonly flipControls: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
    sound: true,
    volume: 5,
    scanlines: true,
    oldColors: false,
    colorblind: false,
    flipControls: false,
};

export type Side = "left" | "right";

// The answer a screen half, arrow key or A / D gives
export function answerOn(side: Side, flipControls: boolean): Answer {
    return (side === "left") !== flipControls ? "true" : "false";
}

export function sideOf(answer: Answer, flipControls: boolean): Side {
    return (answer === "true") !== flipControls ? "left" : "right";
}

function isVolume(value: unknown): value is number {
    return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= VOLUME_STEPS;
}

// Stored values come from older versions or manual edits: every invalid field falls back on its own
export function loadSettings(storage: KeyValueStore | null): Settings {
    let stored: unknown;
    try {
        stored = JSON.parse(storage?.getItem(SETTINGS_KEY) ?? "null");
    } catch {
        // Blocked storage or broken JSON, same as no saved settings
        return DEFAULT_SETTINGS;
    }
    if (typeof stored !== "object" || stored === null) return DEFAULT_SETTINGS;

    const sound = "sound" in stored ? stored.sound : undefined;
    const volume = "volume" in stored ? stored.volume : undefined;
    const scanlines = "scanlines" in stored ? stored.scanlines : undefined;
    const oldColors = "oldColors" in stored ? stored.oldColors : undefined;
    const colorblind = "colorblind" in stored ? stored.colorblind : undefined;
    const flipControls = "flipControls" in stored ? stored.flipControls : undefined;
    return {
        sound: typeof sound === "boolean" ? sound : DEFAULT_SETTINGS.sound,
        volume: isVolume(volume) ? volume : DEFAULT_SETTINGS.volume,
        scanlines: typeof scanlines === "boolean" ? scanlines : DEFAULT_SETTINGS.scanlines,
        oldColors: typeof oldColors === "boolean" ? oldColors : DEFAULT_SETTINGS.oldColors,
        colorblind: typeof colorblind === "boolean" ? colorblind : DEFAULT_SETTINGS.colorblind,
        flipControls: typeof flipControls === "boolean" ? flipControls : DEFAULT_SETTINGS.flipControls,
    };
}

export function saveSettings(storage: KeyValueStore | null, settings: Settings): void {
    try {
        storage?.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
        // Like the highscore: the game keeps running, the settings just last for this visit only
    }
}

export function clearSettings(storage: KeyValueStore | null): void {
    try {
        storage?.removeItem(SETTINGS_KEY);
    } catch {
        // Storage that cannot be written holds no settings either
    }
}

export function changeVolume(settings: Settings, delta: number): Settings {
    const volume = Math.min(VOLUME_STEPS, Math.max(1, settings.volume + delta));
    return volume === settings.volume ? settings : { ...settings, volume };
}
