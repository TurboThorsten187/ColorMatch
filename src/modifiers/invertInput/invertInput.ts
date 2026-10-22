import type { ModifierGroup, PixelIcon } from "@/modifiers/types.ts";

// Two arrows, one to the right and one to the left
const ARROWS: PixelIcon = {
    rows: [".....#.", "..#####", ".....#.", ".......", ".#.....", "#####..", ".#....."],
    directed: false,
};

// The right answer is the opposite one
export const invertInput: ModifierGroup = {
    id: "invertInput",
    tier: "hard",
    variants: ["invertInput"],
    rule: { expect: (answer) => (answer === "true" ? "false" : "true") },
    sign: () => ({ text: "INVERTED INPUT", icon: ARROWS }),
    intro: {
        title: "INVERTED INPUT",
        example: { word: "blue", color: "blue" },
        lines: ["IT MATCHES, BUT...", "ANSWER THE *OPPOSITE*", "TAP RIGHT · FALSE"],
        flippedLines: ["IT MATCHES, BUT...", "ANSWER THE *OPPOSITE*", "TAP LEFT · FALSE"],
        accent: "red",
    },
    award: { code: "II", name: "TURNAROUND", levels: "INVERTED INPUT" },
};
