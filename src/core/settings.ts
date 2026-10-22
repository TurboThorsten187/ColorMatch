import type { Answer } from "./challenge.ts";
import { field } from "./parse.ts";

export const VOLUME_STEPS = 8;

export interface Settings {
    readonly sound: boolean;
    // 1 (quietest) to VOLUME_STEPS (loudest)
    readonly volume: number;
    readonly scanlines: boolean;
    // Shapes instead of colors, see SHAPE_WORDS
    readonly colorblind: boolean;
    // FALSE on the left and TRUE on the right: screen halves, arrow keys and A / D
    readonly flipControls: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
    sound: true,
    volume: 5,
    scanlines: true,
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

function flag(value: unknown, fallback: boolean): boolean {
    return typeof value === "boolean" ? value : fallback;
}

// Every invalid field falls back on its own default
export function parseSettings(stored: unknown): Settings {
    const volume = field(stored, "volume");
    return {
        sound: flag(field(stored, "sound"), DEFAULT_SETTINGS.sound),
        volume: isVolume(volume) ? volume : DEFAULT_SETTINGS.volume,
        scanlines: flag(field(stored, "scanlines"), DEFAULT_SETTINGS.scanlines),
        colorblind: flag(field(stored, "colorblind"), DEFAULT_SETTINGS.colorblind),
        flipControls: flag(field(stored, "flipControls"), DEFAULT_SETTINGS.flipControls),
    };
}
