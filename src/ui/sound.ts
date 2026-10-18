import { type Settings, VOLUME_STEPS } from "../game/settings.ts";
import { type SoundId, SOUNDS } from "./synth.ts";

export interface PlayOptions {
    readonly delayMs?: number;
    // Raises the pitch, for sounds that have one
    readonly semitones?: number;
}

let context: AudioContext | null = null;
let output: GainNode | null = null;
let enabled = true;
let gain = 1;

// Loudness is perceived roughly logarithmically, a squared curve makes the steps sound even
function gainFor(volume: number): number {
    return (volume / VOLUME_STEPS) ** 2;
}

export function configureSound(settings: Settings): void {
    enabled = settings.sound;
    gain = gainFor(settings.volume);
    if (output) output.gain.value = gain;
}

// Browsers keep audio suspended until a user gesture, so every input calls this. The first call
// creates the context, later calls resume a suspended context.
export function unlockAudio(): void {
    if (context) {
        // Besides "suspended", Safari reports "interrupted" after a phone call or an app switch
        if (context.state !== "running") {
            context.resume().catch(() => {
                // Not allowed yet (no real gesture), the next input tries again
            });
        }
        return;
    }

    let created: AudioContext;
    try {
        created = new AudioContext();
    } catch {
        // No Web Audio: the game is still playable, just silent
        return;
    }
    output = created.createGain();
    output.gain.value = gain;
    output.connect(created.destination);
    context = created;
}

export function playSound(id: SoundId, options: PlayOptions = {}): void {
    if (!enabled || !context || !output) return;
    const at = context.currentTime + (options.delayMs ?? 0) / 1000;
    SOUNDS[id]({ context, output }, at, options.semitones ?? 0);
}
