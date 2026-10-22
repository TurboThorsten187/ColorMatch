const SPIN_MS = 2500;
// ROTATION turns unevenly with the strength: its speed swings by up to this share, once every WOBBLE_MS, so at full
// strength it turns at most 1.5 times as fast
const WOBBLE = 0.5;
const WOBBLE_MS = 700;

// Degrees a rotated word has turned after it `played` ms: a full turn every 2.5 s on average, left or right depending
// on the seed. With strength its speed swings, but it never stops or turns back.
export function spin(seed: number, played: number, strength = 0): number {
    const phase = (2 * Math.PI * played) / WOBBLE_MS;
    const wobble = (WOBBLE * strength * WOBBLE_MS * (1 - Math.cos(phase))) / (2 * Math.PI);
    const turns = (played + wobble) / SPIN_MS;
    return 360 * (seed < 0.5 ? turns : -turns);
}
