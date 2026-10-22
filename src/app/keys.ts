import type { Side } from "@/core/settings.ts";
import type { Direction } from "./spatialNav.ts";

// In a level the left and right keys answer (which side means TRUE depends on FLIP CONTROLS, see answerOn); outside
// of one, arrow keys and WASD move the selection between the buttons of a screen.

const SIDE_KEYS: Readonly<Record<string, Side | undefined>> = {
    ArrowLeft: "left",
    ArrowRight: "right",
    a: "left",
    A: "left",
    d: "right",
    D: "right",
};

const DIRECTION_KEYS: Readonly<Record<string, Direction | undefined>> = {
    ArrowUp: "up",
    w: "up",
    W: "up",
    ArrowDown: "down",
    s: "down",
    S: "down",
    ArrowLeft: "left",
    a: "left",
    A: "left",
    ArrowRight: "right",
    d: "right",
    D: "right",
};

const BACK_KEYS: ReadonlySet<string> = new Set(["Escape", "Backspace"]);

export function sideOfKey(key: string): Side | undefined {
    return SIDE_KEYS[key];
}

export function directionOfKey(key: string): Direction | undefined {
    return DIRECTION_KEYS[key];
}

export function isBackKey(key: string): boolean {
    return BACK_KEYS.has(key);
}
