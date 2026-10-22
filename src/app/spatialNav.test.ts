import { describe, expect, it } from "vitest";
import { type Box, neighbor } from "./spatialNav.ts";

const box = (left: number, top: number, width = 40, height = 40): Box => ({ left, top, width, height });

// Like the setup screen: a back button top left, rows of buttons on the right, a wide bar and a wide button below
const SETUP: readonly Box[] = [
    box(10, 10), // 0 back
    box(200, 80), // 1 sound on
    box(250, 80), // 2 sound off
    box(10, 150, 280, 20), // 3 volume bar
    box(200, 200), // 4 scanlines on
    box(250, 200), // 5 scanlines off
    box(10, 300, 280, 50), // 6 hold to reset
];

// Five badges per row, the last row only has two
const GRID: readonly Box[] = Array.from({ length: 12 }, (_, i) => box((i % 5) * 50, Math.floor(i / 5) * 50));

describe("neighbor", () => {
    it("goes down row by row, even when a wide item is closer to the side", () => {
        expect(neighbor(SETUP, 0, "down")).toBe(1);
        expect(neighbor(SETUP, 1, "down")).toBe(3);
        expect(neighbor(SETUP, 3, "down")).toBe(4);
        expect(neighbor(SETUP, 5, "down")).toBe(6);
        expect(neighbor(SETUP, 6, "down")).toBeNull();
    });

    it("goes up to the item closest to the side in the row above", () => {
        expect(neighbor(SETUP, 6, "up")).toBe(4);
        expect(neighbor(SETUP, 2, "up")).toBe(0);
        expect(neighbor(SETUP, 0, "up")).toBeNull();
    });

    it("moves left and right only within the row", () => {
        expect(neighbor(SETUP, 1, "right")).toBe(2);
        expect(neighbor(SETUP, 2, "left")).toBe(1);
        expect(neighbor(SETUP, 2, "right")).toBeNull();
        expect(neighbor(SETUP, 0, "right")).toBeNull();
        expect(neighbor(SETUP, 3, "left")).toBeNull();
    });

    it("walks a grid and stops at its edges", () => {
        expect(neighbor(GRID, 0, "right")).toBe(1);
        expect(neighbor(GRID, 4, "right")).toBeNull();
        expect(neighbor(GRID, 1, "down")).toBe(6);
        expect(neighbor(GRID, 6, "down")).toBe(11);
        // The last row is shorter: the closest badge below is taken
        expect(neighbor(GRID, 9, "down")).toBe(11);
        expect(neighbor(GRID, 11, "up")).toBe(6);
    });
});
