import type { AwardId } from "@/core/awards.ts";
import type { Mode } from "@/core/progression.ts";

// The ids the Play Console gives the leaderboards and achievements (Play Games Services, Configuration), not secret.
// Empty until they are set up there, together with the project id in android/app/src/main/res/values/games.xml;
// without them the app runs without Play Games.

export const LEADERBOARD_IDS: Readonly<Record<Mode, string>> = { normal: "", hardcore: "" };

export const ACHIEVEMENT_IDS: Readonly<Partial<Record<AwardId, string>>> = {};
