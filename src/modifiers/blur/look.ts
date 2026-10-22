import { lerp } from "@/modifiers/look.ts";

// The blur grows with the strength, to 1.5 times as much
const GENTLE_PX = 6;
const STRONG_PX = 9;
// The small rule signs would vanish with that, they get about the same share of their size
export const SIGN_BLUR_EM_PER_PX = 0.014;

export function blurPx(strength: number): number {
    return lerp(GENTLE_PX, STRONG_PX, strength);
}
