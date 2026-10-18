// The browser's offer to install the game (Chrome, Edge, Android), kept for the INSTALL button in the menu.
// The event is not standardized, so only the part the game uses is typed and checked here.

interface InstallOffer extends Event {
    prompt(): Promise<unknown>;
}

function isInstallOffer(event: Event): event is InstallOffer {
    return "prompt" in event && typeof event.prompt === "function";
}

let offer = $state<InstallOffer | null>(null);

// Called before anything else awaits: the browser may make its offer right after the page loads
export function listenForInstallOffer(): void {
    window.addEventListener("beforeinstallprompt", (event) => {
        if (!isInstallOffer(event)) return;
        // The INSTALL button replaces the browser's own install banner
        event.preventDefault();
        offer = event;
    });
    window.addEventListener("appinstalled", () => {
        offer = null;
    });
}

export function canInstall(): boolean {
    return offer !== null;
}

export async function install(): Promise<void> {
    const current = offer;
    if (current === null) return;
    // Every offer can be shown only once, the browser makes a new one if the player declines
    offer = null;
    await current.prompt();
}
