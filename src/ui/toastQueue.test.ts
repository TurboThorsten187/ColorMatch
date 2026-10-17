import { describe, expect, it } from "vitest";
import { delay, enqueue, TOAST_MS, visible } from "./toastQueue.ts";

describe("toast queue", () => {
    it("shows toasts unlocked together one after another", () => {
        const queue = enqueue([], ["a", "b"], 1000);

        expect(visible(queue, 1000)?.item).toBe("a");
        expect(visible(queue, 1000 + TOAST_MS)?.item).toBe("b");
        expect(visible(queue, 1000 + 2 * TOAST_MS)).toBeNull();
    });

    it("queues a later toast behind the one still showing", () => {
        let queue = enqueue([], ["a"], 1000);
        queue = enqueue(queue, ["b"], 1500);

        expect(queue.map((entry) => entry.at)).toEqual([1000, 1000 + TOAST_MS]);
    });

    it("drops toasts that are over", () => {
        let queue = enqueue([], ["a"], 1000);
        queue = enqueue(queue, ["b"], 1000 + TOAST_MS + 1);

        expect(queue).toEqual([{ item: "b", at: 1000 + TOAST_MS + 1 }]);
    });

    it("lets toasts wait while the game is paused", () => {
        const queue = delay(enqueue([], ["a", "b"], 1000), 1400, 5000);

        expect(visible(queue, 1400 + 5000)?.item).toBe("a");
        expect(queue.map((entry) => entry.at)).toEqual([6000, 6000 + TOAST_MS]);
    });

    it("leaves toasts alone that were over before the pause", () => {
        const queue = enqueue([], ["a"], 1000);

        expect(delay(queue, 1000 + TOAST_MS, 5000)).toEqual(queue);
    });
});
