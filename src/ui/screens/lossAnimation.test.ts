import { describe, expect, it } from "vitest";
import { GAME_OVER_LOCK_MS } from "@/core/game.ts";
import {
    blockAt,
    blockSize,
    blocksOpacity,
    BUTTONS_APPEAR_MS,
    LOSS_ANIMATION_MS,
    lossFrame,
    SHAKE_OFFSETS,
    SHATTER_AT_MS,
    wordBlocks,
} from "./lossAnimation.ts";

// RGBA image with the given pixels drawn
// Pixels for which `drawn` gives a color are opaque in that color
function image(
    width: number,
    height: number,
    drawn: (x: number, y: number) => boolean | readonly [number, number, number],
): Uint8ClampedArray {
    const rgba = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const color = drawn(x, y);
            if (color === false) continue;
            rgba.set([...(color === true ? [0, 0, 0] : color), 255], (y * width + x) * 4);
        }
    }
    return rgba;
}

describe("loss animation", () => {
    it("starts with the full picture, a red border and a shake", () => {
        expect(lossFrame(0)).toMatchObject({
            frameOpacity: 1,
            shakeStep: 0,
            shattered: false,
            labelOpacity: 0,
            scaleX: 1,
            scaleY: 1,
            whiteout: 0,
            opacity: 1,
        });
    });

    it("shatters the word and pops up the label", () => {
        expect(lossFrame(SHATTER_AT_MS - 1).shattered).toBe(false);
        expect(lossFrame(SHATTER_AT_MS)).toMatchObject({ shattered: true, labelOpacity: 0 });
        expect(lossFrame(SHATTER_AT_MS + 500)).toMatchObject({ labelOpacity: 1, labelScale: 1, shakeStep: null });
    });

    it("shakes only at the start and always within the offsets", () => {
        const steps = Array.from({ length: 400 }, (_, elapsed) => lossFrame(elapsed).shakeStep);

        expect(steps.filter((step) => step !== null).every((step) => step >= 0 && step < SHAKE_OFFSETS)).toBe(true);
        expect(steps.slice(300)).toEqual(Array(100).fill(null));
    });

    it("squashes the picture to a line, then to a dot, and ends dark", () => {
        const line = lossFrame(1070);
        expect(line.scaleY).toBeLessThan(0.01);
        expect(line.scaleX).toBe(1);
        expect(line.whiteout).toBe(1);

        expect(lossFrame(1230).scaleX).toBeLessThan(0.03);
        expect(lossFrame(LOSS_ANIMATION_MS).opacity).toBe(0);
        expect(LOSS_ANIMATION_MS).toBe(1560);
    });

    it("cannot be skipped: RETRY and MENU wait until it is over and the buttons have appeared", () => {
        expect(GAME_OVER_LOCK_MS).toBeGreaterThanOrEqual(LOSS_ANIMATION_MS + BUTTONS_APPEAR_MS);
    });
});

describe("word blocks", () => {
    it("are made only where the word is drawn", () => {
        // A 10 x 4 bar at x 20, y 8 in a 40 x 20 image
        const rgba = image(40, 20, (x, y) => x >= 20 && x < 30 && y >= 8 && y < 12);
        const blocks = wordBlocks(rgba, 40, 20, 2, () => 0.5);

        expect(blocks).toHaveLength(10);
        expect(blocks.every((b) => b.x >= 20 && b.x < 30 && b.y >= 8 && b.y < 12)).toBe(true);
    });

    it("take the color of the word where they are cut from", () => {
        const rgba = image(40, 20, (x, y) => (y >= 8 && y < 12 ? (x < 20 ? [255, 59, 78] : [34, 228, 255]) : false));
        const blocks = wordBlocks(rgba, 40, 20, 2, () => 0.5);

        expect(blocks).toHaveLength(40);
        expect(blocks.filter((b) => b.x < 20).every((b) => b.color === "rgb(255, 59, 78)")).toBe(true);
        expect(blocks.filter((b) => b.x >= 20).every((b) => b.color === "rgb(34, 228, 255)")).toBe(true);
    });

    it("fly apart from the middle of the word and jump up", () => {
        const rgba = image(40, 20, (x, y) => x >= 10 && x < 30 && y >= 8 && y < 10);
        const blocks = wordBlocks(rgba, 40, 20, 2, () => 0.5);
        const left = blocks.find((b) => b.x === 10);
        const right = blocks.find((b) => b.x === 28);

        expect(left?.vx).toBeLessThan(0);
        expect(right?.vx).toBeGreaterThan(0);
        expect(blocks.every((b) => b.vy < 0)).toBe(true);
    });

    it("stay in place until the word shatters, then fall and fade", () => {
        const block = { x: 50, y: 100, vx: 0, vy: -200, color: "#fff" };

        expect(blockAt(block, 0, 800)).toEqual({ x: 50, y: 100 });
        expect(blockAt(block, SHATTER_AT_MS + 1000, 800).y).toBeGreaterThan(100);
        expect(blocksOpacity(0)).toBe(0);
        expect(blocksOpacity(SHATTER_AT_MS)).toBe(1);
        expect(blocksOpacity(SHATTER_AT_MS + 750)).toBe(0);
    });

    it("grow with the font size", () => {
        expect(blockSize(20)).toBe(4);
        expect(blockSize(140)).toBe(20);
    });
});
