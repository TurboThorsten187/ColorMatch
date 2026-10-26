import { Haptics, ImpactStyle } from "@capacitor/haptics";
import type { Settings } from "@/core/settings.ts";
import { isNativeApp } from "./native.ts";

// Vibration through Capacitor: the Android vibrator in the app, `navigator.vibrate` in a browser on a phone

export type Vibration = "light" | "medium" | "heavy";

const STYLES: Record<Vibration, ImpactStyle> = {
    light: ImpactStyle.Light,
    medium: ImpactStyle.Medium,
    heavy: ImpactStyle.Heavy,
};

let enabled = true;

// The browser cannot tell whether there is a vibration motor: a touch screen with the Vibration API stands for a phone
// (desktop Chrome has the API too, without a motor)
export function canVibrate(): boolean {
    return isNativeApp() || ("vibrate" in navigator && window.matchMedia("(pointer: coarse)").matches);
}

export function configureHaptics(settings: Settings): void {
    enabled = settings.vibration && canVibrate();
}

export function vibrate(vibration: Vibration): void {
    if (!enabled) return;
    Haptics.impact({ style: STYLES[vibration] }).catch((error: unknown) => {
        console.error("Vibration failed", error);
    });
}
