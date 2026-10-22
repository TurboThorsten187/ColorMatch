import type { SessionEvent } from "@/app/session.svelte.ts";
import { type PlayOptions, playSound } from "@/platform/sound.ts";
import type { SoundId } from "@/platform/synth.ts";
import { LOSS_ANIMATION_MS, SQUASH_AT_MS } from "./screens/lossAnimation.ts";

// The sounds of the game: what the player hears for each session event, timed to what the screens show

// The selection moved to another button
export type SoundEvent = SessionEvent | { readonly kind: "move" };

export interface Cue {
    readonly id: SoundId;
    readonly options?: PlayOptions;
}

// Every tap of a SPAM! level sounds higher than the one before
const SPAM_STEP_SEMITONES = 2;
// Sounds that start together with the hit of the level before wait until it is over
const AFTER_HIT_MS = 120;

export function cuesFor(event: SoundEvent): Cue[] {
    switch (event.kind) {
        case "lost":
            return [
                { id: event.reason === "early" ? "miss" : event.reason },
                // The picture shuts off like an old CRT
                { id: "crt", options: { delayMs: SQUASH_AT_MS } },
                // The jingle belongs to the game over screen, which appears after the loss animation
                { id: event.newRecord ? "record" : "gameOver", options: { delayMs: LOSS_ANIMATION_MS } },
            ];
        case "spamTap":
            return [{ id: "spamTap", options: { semitones: (event.count - 1) * SPAM_STEP_SEMITONES } }];
        case "surge":
        case "intro":
            return [{ id: event.kind, options: { delayMs: AFTER_HIT_MS } }];
        default:
            return [{ id: event.kind }];
    }
}

export function playEvent(event: SoundEvent): void {
    for (const cue of cuesFor(event)) playSound(cue.id, cue.options);
}
