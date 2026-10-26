package io.github.turbothorsten187.colormatch;

import android.content.Context;
import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.games.AuthenticationResult;
import com.google.android.gms.games.PlayGames;
import com.google.android.gms.games.PlayGamesSdk;
import com.google.android.gms.tasks.Task;

// Google Play Games Services v2 for src/platform/playGames.svelte.ts: sign-in, leaderboards, achievements
@CapacitorPlugin(name = "PlayGames")
public class PlayGamesPlugin extends Plugin {

    // The Play Games screens report nothing back the game needs
    private static final int RC_PLAY_GAMES_UI = 9003;

    // Without the project id from the Play Console (res/values/games.xml) the game runs without Play Games
    static boolean isConfigured(Context context) {
        return !context.getString(R.string.game_services_project_id).isEmpty();
    }

    static void initialize(Context context) {
        if (isConfigured(context)) PlayGamesSdk.initialize(context);
    }

    // Play Games signs in by itself when the app starts; this asks whether that worked
    @PluginMethod
    public void isAuthenticated(PluginCall call) {
        if (!isConfigured(getContext())) {
            resolveAuthentication(call, false, false);
            return;
        }
        PlayGames.getGamesSignInClient(getActivity()).isAuthenticated().addOnCompleteListener((task) -> resolve(call, task));
    }

    @PluginMethod
    public void signIn(PluginCall call) {
        if (!isConfigured(getContext())) {
            resolveAuthentication(call, false, false);
            return;
        }
        PlayGames.getGamesSignInClient(getActivity()).signIn().addOnCompleteListener((task) -> resolve(call, task));
    }

    @PluginMethod
    public void submitScore(PluginCall call) {
        String leaderboardId = call.getString("leaderboardId");
        Long score = call.getLong("score");
        if (leaderboardId == null || score == null) {
            call.reject("leaderboardId and score are needed");
            return;
        }
        // Play Games keeps only the best score and sends it once it is online
        PlayGames.getLeaderboardsClient(getActivity()).submitScore(leaderboardId, score);
        call.resolve();
    }

    @PluginMethod
    public void unlockAchievement(PluginCall call) {
        String achievementId = call.getString("achievementId");
        if (achievementId == null) {
            call.reject("achievementId is needed");
            return;
        }
        PlayGames.getAchievementsClient(getActivity()).unlock(achievementId);
        call.resolve();
    }

    @PluginMethod
    public void showLeaderboards(PluginCall call) {
        show(call, PlayGames.getLeaderboardsClient(getActivity()).getAllLeaderboardsIntent());
    }

    @PluginMethod
    public void showAchievements(PluginCall call) {
        show(call, PlayGames.getAchievementsClient(getActivity()).getAchievementsIntent());
    }

    private void show(PluginCall call, Task<Intent> screen) {
        screen
            .addOnSuccessListener((intent) -> {
                getActivity().startActivityForResult(intent, RC_PLAY_GAMES_UI);
                call.resolve();
            })
            .addOnFailureListener((error) -> call.reject("Play Games could not open", error));
    }

    private void resolve(PluginCall call, Task<AuthenticationResult> task) {
        resolveAuthentication(call, true, task.isSuccessful() && task.getResult().isAuthenticated());
    }

    private void resolveAuthentication(PluginCall call, boolean available, boolean authenticated) {
        JSObject result = new JSObject();
        result.put("available", available);
        result.put("authenticated", authenticated);
        call.resolve(result);
    }
}
