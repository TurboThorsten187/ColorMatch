import { lerp } from "@/modifiers/look.ts";

// Pulsing swings between a low and a high scale, both further from 1 with the strength, 1.5 times as far at full
// strength
const PERIOD_MS = 350;
const LOW_GENTLE = 0.85;
const LOW_STRONG = 0.775;
const HIGH_GENTLE = 1.08;
const HIGH_STRONG = 1.12;

export function pulseRange(strength: number): { readonly low: number; readonly high: number } {
    return { low: lerp(LOW_GENTLE, LOW_STRONG, strength), high: lerp(HIGH_GENTLE, HIGH_STRONG, strength) };
}

// Font size factor that keeps the word on screen at its largest
export function pulseFontScale(strength: number): number {
    return 1 / pulseRange(strength).high;
}

export function pulseScale(seed: number, played: number, strength = 0): number {
    const { low, high } = pulseRange(strength);
    const middle = (low + high) / 2;
    const swing = (high - low) / 2;
    return middle + swing * Math.sin((2 * Math.PI * (played + seed * PERIOD_MS)) / PERIOD_MS);
}
