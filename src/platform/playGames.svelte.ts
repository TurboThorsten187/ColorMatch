import { registerPlugin } from "@capacitor/core";
import type { AwardId } from "@/core/awards.ts";
import type { Highscores } from "@/core/highscore.ts";
import type { Mode } from "@/core/progression.ts";
import { isNativeApp } from "./native.ts";
import { ACHIEVEMENT_IDS, LEADERBOARD_IDS } from "./playGamesIds.ts";

// Google Play Games in the Android app (android/.../PlayGamesPlugin.java): the highscores go to a leaderboard per mode,
// the awards become achievements. Play Games keeps the best and unlocks once, so everything kept on the device is
// handed on again after every start and sign-in, also what was reached before.

interface Authentication {
    // Set up in the Play Console and in this build
    readonly available: boolean;
    readonly authenticated: boolean;
}

interface PlayGamesPlugin {
    isAuthenticated(): Promise<Authentication>;
    signIn(): Promise<Authentication>;
    submitScore(options: { leaderboardId: string; score: number }): Promise<void>;
    unlockAchievement(options: { achievementId: string }): Promise<void>;
    showLeaderboards(): Promise<void>;
    showAchievements(): Promise<void>;
}

const plugin = registerPlugin<PlayGamesPlugin>("PlayGames");

const MODES: readonly Mode[] = ["normal", "hardcore"];

// null while unknown or without Play Games
let signedIn = $state<boolean | null>(null);

// What this app start has handed on already
const submitted: Record<Mode, number> = { normal: 0, hardcore: 0 };
const unlocked: Partial<Record<AwardId, true>> = {};

function reportFailure(what: string): (error: unknown) => void {
    return (error) => console.error(`Play Games: ${what} failed`, error);
}

function take(authentication: Authentication): void {
    signedIn = authentication.available ? authentication.authenticated : null;
}

// Whether Play Games is there at all; the menu shows its buttons then
export function hasPlayGames(): boolean {
    return signedIn !== null;
}

// Whether the automatic sign-in failed, so the menu offers SIGN IN
export function needsSignIn(): boolean {
    return signedIn === false;
}

export function startPlayGames(): void {
    if (!isNativeApp() || LEADERBOARD_IDS.normal === "") return;
    plugin.isAuthenticated().then(take, reportFailure("checking the sign-in"));
}

export function signIn(): void {
    plugin.signIn().then(take, reportFailure("signing in"));
}

// Hands on what is new since the last call; reads the sign-in state, so an $effect runs it again after a sign-in
export function syncPlayGames(highscores: Highscores, awards: readonly AwardId[]): void {
    if (signedIn !== true) return;
    for (const mode of MODES) {
        const score = highscores[mode];
        if (score <= submitted[mode]) continue;
        submitted[mode] = score;
        plugin.submitScore({ leaderboardId: LEADERBOARD_IDS[mode], score }).catch(reportFailure("a score"));
    }
    for (const award of awards) {
        const achievementId = ACHIEVEMENT_IDS[award];
        if (achievementId === undefined || unlocked[award]) continue;
        unlocked[award] = true;
        plugin.unlockAchievement({ achievementId }).catch(reportFailure("an achievement"));
    }
}

export function showLeaderboards(): void {
    plugin.showLeaderboards().catch(reportFailure("the leaderboards"));
}

export function showAchievements(): void {
    plugin.showAchievements().catch(reportFailure("the achievements"));
}
