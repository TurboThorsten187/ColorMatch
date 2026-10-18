// Chiptune sounds built from oscillators when they play, so the game needs no audio files. Picked in the sound lab:
// https://claude.ai/artifact/Xu6LJRusfSvtTA3XrtdeZi

export type SoundId =
    | "hit"
    | "miss"
    | "timeout"
    | "spamTap"
    | "click"
    | "crt"
    | "gameOver"
    | "record"
    | "surge"
    | "award"
    | "intro"
    | "lowTime";

export interface Voice {
    readonly context: BaseAudioContext;
    readonly output: AudioNode;
}

interface Tone {
    readonly wave?: OscillatorType;
    // Hz; with `to` the pitch slides there over the whole tone
    readonly from: number;
    readonly to?: number;
    readonly seconds: number;
    readonly gain: number;
    // Stays loud for most of the tone instead of fading right away
    readonly hold?: boolean;
}

type Recipe = (voice: Voice, at: number, semitones: number) => void;

// Exponential ramps cannot reach 0
const SILENT = 0.0001;
const ATTACK_SECONDS = 0.005;
const HOLD_SHARE = 0.75;

export function midiHz(note: number): number {
    return 440 * 2 ** ((note - 69) / 12);
}

function tone({ context, output }: Voice, at: number, { wave = "square", from, to, seconds, gain, hold }: Tone): void {
    const oscillator = context.createOscillator();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(from, at);
    if (to !== undefined) oscillator.frequency.exponentialRampToValueAtTime(to, at + seconds);

    const envelope = context.createGain();
    envelope.gain.setValueAtTime(SILENT, at);
    envelope.gain.exponentialRampToValueAtTime(gain, at + ATTACK_SECONDS);
    if (hold) envelope.gain.setValueAtTime(gain, at + seconds * HOLD_SHARE);
    envelope.gain.exponentialRampToValueAtTime(SILENT, at + seconds);

    oscillator.connect(envelope).connect(output);
    oscillator.onended = () => envelope.disconnect();
    oscillator.start(at);
    oscillator.stop(at + seconds + 0.05);
}

// A row of notes `step` seconds apart; the last one rings for `last` seconds
function notes(
    voice: Voice,
    at: number,
    midiNotes: readonly number[],
    step: number,
    { last = step, ...options }: Omit<Tone, "from" | "to" | "seconds"> & { readonly last?: number },
): void {
    midiNotes.forEach((note, index) =>
        tone(voice, at + index * step, {
            ...options,
            from: midiHz(note),
            seconds: index === midiNotes.length - 1 ? last : step,
        }),
    );
}

export const SOUNDS: Readonly<Record<SoundId, Recipe>> = {
    hit: (voice, at) => notes(voice, at, [76, 83], 0.045, { gain: 0.07, last: 0.07 }),
    miss: (voice, at) => tone(voice, at, { from: 440, to: 70, seconds: 0.35, gain: 0.1 }),
    timeout: (voice, at) =>
        tone(voice, at, { wave: "triangle", from: midiHz(72), to: midiHz(36), seconds: 0.6, gain: 0.3, hold: true }),
    spamTap: (voice, at, semitones) => tone(voice, at, { from: midiHz(72 + semitones), seconds: 0.05, gain: 0.07 }),
    click: (voice, at) => tone(voice, at, { from: midiHz(84), seconds: 0.03, gain: 0.06 }),
    crt: (voice, at) => tone(voice, at, { wave: "triangle", from: 900, to: 120, seconds: 0.18, gain: 0.25 }),
    gameOver: (voice, at) =>
        tone(voice, at, { wave: "sawtooth", from: 660, to: 35, seconds: 1.1, gain: 0.1, hold: true }),
    record: (voice, at) =>
        notes(voice, at, [72, 74, 76, 77, 79, 81, 83, 84, 88], 0.05, { gain: 0.05, last: 0.45, hold: true }),
    surge: (voice, at) => {
        tone(voice, at, { wave: "sawtooth", from: 110, to: 880, seconds: 0.6, gain: 0.08, hold: true });
        tone(voice, at + 0.62, { from: 880, seconds: 0.18, gain: 0.08 });
    },
    award: (voice, at) => notes(voice, at, [84, 88, 91, 96], 0.045, { wave: "triangle", gain: 0.2, last: 0.25 }),
    intro: (voice, at) => notes(voice, at, [72, 79], 0.1, { gain: 0.07, last: 0.14 }),
    lowTime: (voice, at) => tone(voice, at, { from: 1760, seconds: 0.06, gain: 0.035 }),
};
