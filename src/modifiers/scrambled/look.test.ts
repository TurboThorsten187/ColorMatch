import { describe, expect, it } from "vitest";
import { letterOrder, scramble, scrambleWords } from "./look.ts";

describe("scrambled letters", () => {
    it("are always a different order of the same letters", () => {
        for (const word of ["RED", "GREEN", "BLUE", "YELLOW", "PURPLE", "CYAN"]) {
            for (let elapsed = 0; elapsed < 20000; elapsed += 97) {
                const scrambled = scramble(word, 0.42, elapsed);

                expect(scrambled).not.toBe(word);
                expect([...scrambled].sort()).toEqual([...word].sort());
            }
        }
    });

    it("change over time and stay put within one step", () => {
        const orders = new Set(Array.from({ length: 30 }, (_, i) => letterOrder(6, 0.1, i * 380).join()));

        expect(orders.size).toBeGreaterThan(5);
        expect(letterOrder(6, 0.1, 0)).toEqual(letterOrder(6, 0.1, 379));
    });

    it("mix a rule text word by word and keep its words apart", () => {
        for (const text of ["DON'T CLICK", "INVERTED INPUT"]) {
            const words = text.split(" ");
            for (let elapsed = 0; elapsed < 20000; elapsed += 97) {
                const scrambled = scrambleWords(text, 0.42, elapsed).split(" ");

                expect(scrambled).toHaveLength(words.length);
                scrambled.forEach((word, index) => {
                    expect(word).not.toBe(words[index]);
                    expect([...word].sort()).toEqual([...words[index]].sort());
                });
            }
        }
    });
});
