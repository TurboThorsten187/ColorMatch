const HIGHSCORE_KEY = "colormatch_highscore";

// localStorage kann z. B. im privaten Modus oder bei blockierten Cookies Fehler werfen,
// das Spiel soll dann trotzdem laufen.
export function getHighscore(): number {
    try {
        const stored = Number.parseInt(localStorage.getItem(HIGHSCORE_KEY) ?? "", 10);
        return Number.isNaN(stored) ? 0 : stored;
    } catch {
        return 0;
    }
}

export function saveHighscore(score: number): void {
    if (score <= getHighscore()) return;

    try {
        localStorage.setItem(HIGHSCORE_KEY, String(score));
    } catch {
        // Highscore kann nicht gespeichert werden
    }
}
