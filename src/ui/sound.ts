import clickUrl from "../assets/sounds/click.ogg";
import gameOverUrl from "../assets/sounds/game-over.ogg";
import hitUrl from "../assets/sounds/hit.ogg";
import missUrl from "../assets/sounds/miss.ogg";
import recordUrl from "../assets/sounds/record.ogg";
import spamTapUrl from "../assets/sounds/spam-tap.ogg";
import timeoutUrl from "../assets/sounds/timeout.ogg";
import { type Settings, VOLUME_STEPS } from "../game/settings.ts";

export type SoundId = "hit" | "miss" | "timeout" | "spamTap" | "click" | "gameOver" | "record";

export interface PlayOptions {
    readonly delayMs?: number;
    // 1 is the original pitch, 2 one octave higher
    readonly rate?: number;
}

const SOURCES: Readonly<Record<SoundId, string>> = {
    hit: hitUrl,
    miss: missUrl,
    timeout: timeoutUrl,
    spamTap: spamTapUrl,
    click: clickUrl,
    gameOver: gameOverUrl,
    record: recordUrl,
};

let context: AudioContext | null = null;
let output: GainNode | null = null;
let enabled = true;
let gain = 1;
const buffers = new Map<string, Promise<AudioBuffer | null>>();

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
// creates the context and decodes all sounds once, later calls resume a suspended context.
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
    for (const [id, url] of Object.entries(SOURCES)) {
        buffers.set(id, decode(created, url));
    }
}

async function decode(target: AudioContext, url: string): Promise<AudioBuffer | null> {
    try {
        const response = await fetch(url);
        return await target.decodeAudioData(await response.arrayBuffer());
    } catch {
        // The game works without sound, e.g. on old browsers that cannot decode OGG
        return null;
    }
}

export function playSound(id: SoundId, options: PlayOptions = {}): void {
    const target = context;
    const destination = output;
    const buffer = buffers.get(id);
    if (!enabled || !target || !destination || !buffer) return;

    const startAt = target.currentTime + (options.delayMs ?? 0) / 1000;
    void buffer.then((decoded) => {
        if (!decoded) return;
        const source = target.createBufferSource();
        source.buffer = decoded;
        source.playbackRate.value = options.rate ?? 1;
        source.connect(destination);
        // Sounds requested before decoding finished start late rather than not at all
        source.start(Math.max(startAt, target.currentTime));
    });
}
