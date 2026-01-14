const HIGHSCORE_KEY = "colormatch_highscore";

export function getHighscore() {
    return parseInt(localStorage.getItem(HIGHSCORE_KEY)) || 0;
}

export function setHighscore(newScore) {
    const current = getHighscore();
    if (newScore > current) {
        localStorage.setItem(HIGHSCORE_KEY, newScore - 1);
    }
}
