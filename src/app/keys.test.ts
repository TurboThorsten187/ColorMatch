import { describe, expect, it } from "vitest";
import { directionOfKey, isBackKey, sideOfKey } from "./keys.ts";

describe("keys", () => {
    it("answer with the arrow keys and A / D in either case", () => {
        for (const key of ["ArrowLeft", "a", "A"]) expect(sideOfKey(key)).toBe("left");
        for (const key of ["ArrowRight", "d", "D"]) expect(sideOfKey(key)).toBe("right");
        for (const key of ["ArrowUp", "w", "Enter"]) expect(sideOfKey(key)).toBeUndefined();
    });

    it("move the selection with the arrow keys and WASD", () => {
        expect(["ArrowUp", "w", "W"].map(directionOfKey)).toEqual(["up", "up", "up"]);
        expect(["ArrowDown", "s", "S"].map(directionOfKey)).toEqual(["down", "down", "down"]);
        expect(["ArrowLeft", "a", "A"].map(directionOfKey)).toEqual(["left", "left", "left"]);
        expect(["ArrowRight", "d", "D"].map(directionOfKey)).toEqual(["right", "right", "right"]);
        expect(directionOfKey("Enter")).toBeUndefined();
    });

    it("go back with Escape and Backspace", () => {
        expect(isBackKey("Escape")).toBe(true);
        expect(isBackKey("Backspace")).toBe(true);
        expect(isBackKey("Enter")).toBe(false);
    });
});
