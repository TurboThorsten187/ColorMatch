package io.github.turbothorsten187.colormatch;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Plugins of this app are registered before the bridge starts
        registerPlugin(PlayGamesPlugin.class);
        PlayGamesPlugin.initialize(getApplicationContext());
        super.onCreate(savedInstanceState);
    }

    // Full screen: the status and navigation bars stay hidden, a swipe from the edge shows them for a moment. Hidden
    // again whenever the game gets the focus back, e.g. after another app or the notification shade.
    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (!hasFocus) return;
        WindowInsetsControllerCompat bars = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        bars.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        bars.hide(WindowInsetsCompat.Type.systemBars());
    }
}
