<script lang="ts">
    import type { Session } from "@/app/session.svelte.ts";
    import { awardById } from "@/core/awards.ts";
    import { isGameOverLocked, isSpamBang } from "@/core/game.ts";
    import { introById } from "@/core/intros.ts";
    import { canInstall, install } from "@/platform/install.svelte.ts";
    import AwardToast from "./hud/AwardToast.svelte";
    import FeedbackFlash from "./hud/FeedbackFlash.svelte";
    import GameOverScreen from "./screens/GameOverScreen.svelte";
    import LevelScreen from "./screens/LevelScreen.svelte";
    import { showsLoss } from "./screens/lossAnimation.ts";
    import LossScreen from "./screens/LossScreen.svelte";
    import MenuScreen from "./screens/MenuScreen.svelte";
    import ModifierIntroScreen from "./screens/ModifierIntroScreen.svelte";
    import PauseScreen from "./screens/PauseScreen.svelte";
    import SettingsScreen from "./screens/SettingsScreen.svelte";
    import SpamPauseScreen from "./screens/SpamPauseScreen.svelte";
    import StatsScreen from "./screens/StatsScreen.svelte";
    import SurgeBanner from "./screens/SurgeBanner.svelte";
    import TutorialScreen from "./screens/TutorialScreen.svelte";
    import { playEvent } from "./sounds.ts";

    interface Props {
        session: Session;
        width: number;
        height: number;
    }

    let { session, width, height }: Props = $props();

    const FLASH_MS = 150;
    const FEEDBACK_MS = 700;

    const game = $derived(session.game);
    const now = $derived(session.now);
    const settings = $derived(session.settings);
    // The hint of the answer just given lights up
    const flash = $derived(
        session.lastAnswer && now - session.lastAnswer.at < FLASH_MS ? session.lastAnswer.answer : null,
    );

    function installGame(): void {
        playEvent({ kind: "click" });
        install().catch((error: unknown) => {
            console.error("Install prompt failed", error);
        });
    }
</script>

<!-- The screen the session is on, with the +1 or MISS! and award toasts on top -->
{#if session.view === "settings"}
    <SettingsScreen
        {settings}
        onchange={(next) => session.changeSettings(next)}
        onreset={() => session.resetAll()}
        onreplay={() => session.startTutorial()}
        onback={() => session.showView("game")}
    />
{:else if session.view === "stats"}
    <StatsScreen
        stats={session.save.stats}
        highscore={session.save.highscores.normal}
        onback={() => session.showView("game")}
    />
{:else if session.tutorial}
    <TutorialScreen
        tutorial={session.tutorial}
        {flash}
        {width}
        {height}
        colorblind={settings.colorblind}
        flipControls={settings.flipControls}
        onnext={() => session.tutorialNext()}
        onskip={() => session.skipTutorial()}
    />
{:else if game.phase === "menu"}
    <MenuScreen
        highscore={session.save.highscores.normal}
        hardcoreHighscore={session.save.highscores.hardcore}
        hardcoreUnlocked={session.hardcoreUnlocked}
        flipControls={settings.flipControls}
        onstart={() => session.goOn()}
        onhardcore={() => session.startHardcore()}
        onstats={() => session.showView("stats")}
        onsetup={() => session.showView("settings")}
        oninstall={canInstall() ? installGame : undefined}
    />
{:else if game.phase === "playing" || (game.phase === "spamPause" && isSpamBang(game, now))}
    <!-- The solved SPAM! stays a moment, frozen at its last press -->
    <LevelScreen
        level={game.phase === "playing" ? game : game.solved}
        time={game.phase === "playing" ? now : game.solvedAt}
        highscore={session.highscore}
        {width}
        {height}
        colorblind={settings.colorblind}
        flipControls={settings.flipControls}
        {flash}
    />
{:else if game.phase === "gameOver" && showsLoss(game, now)}
    <LossScreen
        level={game.lost}
        lostAt={game.endedAt}
        kind={game.reason}
        elapsed={now - game.endedAt}
        highscore={session.highscore}
        {width}
        {height}
        colorblind={settings.colorblind}
        flipControls={settings.flipControls}
    />
{:else if game.phase === "spamPause"}
    <SpamPauseScreen />
{:else if game.phase === "surgeBanner"}
    <SurgeBanner />
{:else if game.phase === "paused" && session.intros.length > 0}
    <ModifierIntroScreen
        intro={introById(session.intros[0])}
        level={game.resumeTo.level}
        elapsed={now - game.pausedAt}
        colorblind={settings.colorblind}
        flipControls={settings.flipControls}
        ongotit={() => session.gotIt()}
    />
{:else if game.phase === "paused"}
    <PauseScreen />
{:else if game.phase === "gameOver"}
    <GameOverScreen
        score={game.score}
        highscore={session.highscore}
        newRecord={session.newRecord}
        awards={session.gameAwards}
        locked={isGameOverLocked(game, now)}
        onretry={() => session.goOn()}
        onmenu={() => session.goToMenu()}
    />
{/if}

{#if session.feedback && now - session.feedback.at < FEEDBACK_MS}
    {#key session.feedback.at}
        <FeedbackFlash kind={session.feedback.kind} />
    {/key}
{/if}

{#if session.toast}
    {#key session.toast.at}
        <AwardToast award={awardById(session.toast.item)} />
    {/key}
{/if}
