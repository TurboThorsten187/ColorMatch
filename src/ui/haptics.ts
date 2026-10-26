import type { SessionEvent } from "@/app/session.svelte.ts";
import { type Vibration, vibrate } from "@/platform/haptics.ts";

// What the player feels for each session event: a mistake and the end of a game, and every SPAM! tap. Everything else
// only sounds, a buzz on every solved level would soon be noise.
export function vibrationFor(event: SessionEvent): Vibration | null {
    switch (event.kind) {
        case "spamTap":
            return "light";
        case "miss":
            return "medium";
        case "lost":
            return "heavy";
        default:
            return null;
    }
}

export function feelEvent(event: SessionEvent): void {
    const vibration = vibrationFor(event);
    if (vibration) vibrate(vibration);
}
