// LOW TIME: a red frame glows once the timer turns red and gets stronger until the time is up
const GLOW = 0.3;
const GLOW_START = 0.35;

// Opacity of the red frame for the share of the time that is left, starting below `from`
export function lowTimeGlow(remaining: number, from: number): number {
    if (remaining >= from) return 0;
    const progress = 1 - Math.max(0, remaining) / from;
    return GLOW * (GLOW_START + (1 - GLOW_START) * progress);
}
