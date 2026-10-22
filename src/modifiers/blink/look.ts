const FADE_MS = 900;

// A fading word is gone after 0.9 s, it fades out instead of vanishing at once
export function fadeOpacity(played: number): number {
    return Math.max(0, 1 - played / FADE_MS);
}
