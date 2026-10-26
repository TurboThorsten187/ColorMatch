import type { CapacitorConfig } from "@capacitor/cli";

// The Android app (android/) wraps the same production build as the web version: `npm run android:sync`
const config: CapacitorConfig = {
    appId: "io.github.turbothorsten187.colormatch",
    appName: "ColorMatch",
    webDir: "dist",
};

export default config;
