// Build-time settings from the environment (`.env.example` lists them)
interface ImportMetaEnv {
    // Sentry's address for the app's crash reports. Not secret, but kept out of the code; without it there are none.
    readonly VITE_SENTRY_DSN?: string;
}
