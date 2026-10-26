import { Capacitor } from "@capacitor/core";

// The Android app runs the same production build as the web version, so it is told apart at runtime, not by a Vite mode
// (another mode would ship the gallery and the test seed).
export function isNativeApp(): boolean {
    return Capacitor.isNativePlatform();
}
