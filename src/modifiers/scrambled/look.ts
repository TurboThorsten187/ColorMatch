import { noise } from "@/modifiers/look.ts";

const STEP_MS = 380;
// Shifts the seed for every word of a rule text, so it is not mixed in step with the color word
const WORD_SEED_STEP = 0.37;

// The letters in a new order every few hundred ms, never the right one
export function letterOrder(length: number, seed: number, played: number): number[] {
    const step = Math.floor(played / STEP_MS);
    const order = Array.from({ length }, (_, i) => i);
    for (let i = length - 1; i > 0; i--) {
        const j = Math.floor(noise(seed, step, i) * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
    }
    // Shifting by one is never the right order either
    return order.every((value, index) => value === index) ? order.map((_, i) => (i + 1) % length) : order;
}

export function scramble(word: string, seed: number, played: number): string {
    const order = letterOrder(word.length, seed, played);
    // Swapping two equal letters, like the Es in GREEN, still shows the word: shift the order until it differs
    for (let shift = 0; shift < order.length; shift++) {
        const scrambled = order.map((_, i) => word[order[(i + shift) % order.length]]).join("");
        if (scrambled !== word) return scrambled;
    }
    return word;
}

// A rule text like DON'T CLICK is mixed word by word, each word in its own order, so it still reads as two words
export function scrambleWords(text: string, seed: number, played: number): string {
    return text
        .split(" ")
        .map((word, index) => scramble(word, (seed + WORD_SEED_STEP * (index + 1)) % 1, played))
        .join(" ");
}
