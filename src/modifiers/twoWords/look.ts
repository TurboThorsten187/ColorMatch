// Both words get this share of the normal size and sit this many font sizes above and below the middle
export const DUO_SIZE = 0.8;
export const DUO_OFFSET = 0.75;
// Shifts the seed for the lower word, so it scrambles, flips and flies in its own way
const LINE_SEED_STEP = 0.29;

// The seed of the upper (0) or lower (1) word
export function lineSeed(seed: number, line: number): number {
    return (seed + LINE_SEED_STEP * line) % 1;
}
