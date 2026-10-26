import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

// The Android app runs the same production build as the web version, so it is told apart at runtime, not by a Vite mode
// (another mode would ship the gallery and the test seed).
export function isNativeApp(): boolean {
    return Capacitor.isNativePlatform();
}

export interface AppEvents {
    // Android's back button or back gesture
    back(): void;
    // The app went to the background
    hidden(): void;
}

// Listens to what only the Android app gets; returns a function that stops listening. With a back listener Android no
// longer closes the app on back by itself.
export function listenToApp(events: AppEvents): () => void {
    if (!isNativeApp()) return () => {};
    const handles = [
        App.addListener("backButton", () => events.back()),
        App.addListener("appStateChange", ({ isActive }) => {
            if (!isActive) events.hidden();
        }),
    ];
    return () => {
        for (const handle of handles) void handle.then((listener) => listener.remove());
    };
}

export function minimizeApp(): void {
    App.minimizeApp().catch((error: unknown) => {
        console.error("Minimizing the app failed", error);
    });
}
