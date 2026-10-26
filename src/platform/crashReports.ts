import type { Settings } from "@/core/settings.ts";
import { isNativeApp } from "./native.ts";

// Anonymous error reports through Sentry: only in the Android app, only with a DSN from the build and only while
// CRASH REPORTS is on. Errors and crashes only: no personal data, no sessions, no tracing, no replays.

const DSN = import.meta.env.VITE_SENTRY_DSN;

// The Android SDK fills an empty user.id with an id of the installation, a fixed one keeps the reports anonymous. Its
// device.id is that id too: `beforeSend` drops it from reports of the game, for crashes of the app itself the Sentry
// project removes it (data scrubbing, see README).
const ANONYMOUS = { id: "anonymous" };

// A chunk of its own, loaded on the first start: the web version never needs it
const sentry = () => import("@sentry/capacitor");

let running = false;
// Sentry 4.4 cannot send from the game again once closed: turned back on, the reports start with the next app start
let closed = false;
// Starting and stopping run one after the other, loading and closing take a moment
let switching: Promise<void> = Promise.resolve();

export function canReportCrashes(): boolean {
    return isNativeApp() && Boolean(DSN);
}

export function configureCrashReports(settings: Settings): void {
    const wanted = settings.crashReports && canReportCrashes();
    if (wanted === running || (wanted && closed)) return;
    running = wanted;
    closed ||= !wanted;
    switching = switching.then(wanted ? start : stop).catch((error: unknown) => {
        console.error("Switching crash reports failed", error);
    });
}

async function start(): Promise<void> {
    const Sentry = await sentry();
    Sentry.init({
        dsn: DSN,
        sendDefaultPii: false,
        // Sentry 4.4 does not hand this on to Android, AndroidManifest.xml turns its sessions off as well
        enableAutoSessionTracking: false,
        // Reports from the game itself get the Android device context, with that installation id
        beforeSend(event) {
            delete event.contexts?.device?.id;
            return event;
        },
    });
    Sentry.setUser(ANONYMOUS);
}

async function stop(): Promise<void> {
    const Sentry = await sentry();
    await Sentry.close();
}
