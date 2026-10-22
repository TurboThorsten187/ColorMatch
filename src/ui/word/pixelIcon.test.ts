import { describe, expect, it } from "vitest";
import { wait } from "@/modifiers/wait/wait.ts";
import { pixelsOf } from "./pixelIcon.ts";

describe("pixel icons", () => {
    it("list the pixels of an icon by column and row", () => {
        const now = wait.sign?.(1).icon;
        if (!now) throw new Error("WAIT has no sign");
        const pixels = pixelsOf(now);

        expect(pixels).toHaveLength(16);
        expect(pixels[0]).toEqual({ x: 0, y: 0 });
        expect(pixels).toContainEqual({ x: 3, y: 3 });
    });
});
