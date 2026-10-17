<script lang="ts">
    import type { Answer } from "./game/challenge.ts";
    import { answer, type GameState, MENU, startGame, tick } from "./game/game.ts";
    import { browserStorage, loadHighscore, saveHighscore } from "./game/highscore.ts";
    import ChallengeScreen from "./ui/ChallengeScreen.svelte";
    import GameOverScreen from "./ui/GameOverScreen.svelte";
    import MenuScreen from "./ui/MenuScreen.svelte";
    import SpamPauseScreen from "./ui/SpamPauseScreen.svelte";

    const ANSWER_KEYS: Readonly<Record<string, Answer | undefined>> = {
        ArrowLeft: "true",
        ArrowRight: "false",
    };

    const storage = browserStorage();
    const rng = Math.random;

    // Game states are immutable, so raw state is enough: reactivity only on reassignment
    let game = $state.raw<GameState>(MENU);
    let now = $state(performance.now());
    let highscore = $state(loadHighscore(storage));
    let width = $state(0);
    let height = $state(0);

    function update(next: GameState): void {
        if (next.phase === "gameOver" && game.phase !== "gameOver") {
            saveHighscore(storage, next.score);
            // Re-read: another tab may have stored a better score meanwhile
            highscore = Math.max(highscore, next.score, loadHighscore(storage));
        }
        game = next;
    }

    $effect(() => {
        let frame = requestAnimationFrame(function loop(time) {
            now = time;
            update(tick(game, time, rng));
            frame = requestAnimationFrame(loop);
        });
        return () => cancelAnimationFrame(frame);
    });

    function onKeydown(event: KeyboardEvent): void {
        // Held keys fire keydown repeatedly, that does not count as a new input
        if (event.repeat) return;

        switch (game.phase) {
            case "menu":
                if (event.key === "Enter") update(startGame(performance.now(), rng));
                break;
            case "playing": {
                const input = ANSWER_KEYS[event.key];
                if (input) {
                    event.preventDefault();
                    update(answer(game, input, performance.now(), rng));
                }
                break;
            }
            case "gameOver":
                if (event.key === "Enter") update(MENU);
                break;
        }
    }
</script>

<svelte:window onkeydown={onKeydown} />

<main class="stage" bind:clientWidth={width} bind:clientHeight={height}>
    {#if game.phase === "menu"}
        <MenuScreen />
    {:else if game.phase === "playing"}
        <ChallengeScreen challenge={game.challenge} elapsed={now - game.startedAt} {width} {height} />
    {:else if game.phase === "spamPause"}
        <SpamPauseScreen {width} {height} />
    {:else}
        <GameOverScreen score={game.score} {highscore} />
    {/if}
</main>

<style>
    .stage {
        position: fixed;
        inset: 0;
        overflow: hidden;
        font-family: sans-serif;
        font-weight: bold;
        user-select: none;
        cursor: default;
        /* Font size unit: 1 % of the width, capped by the height on very wide screens */
        --unit: min(1vw, 1.8dvh);
    }
</style>
