<script lang="ts">
    import type { Answer } from "./game/challenge.ts";
    import { answer, confirm, type GameState, MENU, pause, tick } from "./game/game.ts";
    import { browserStorage, loadHighscore, saveHighscore } from "./game/highscore.ts";
    import ChallengeScreen from "./ui/ChallengeScreen.svelte";
    import GameOverScreen from "./ui/GameOverScreen.svelte";
    import MenuScreen from "./ui/MenuScreen.svelte";
    import PauseScreen from "./ui/PauseScreen.svelte";
    import SpamPauseScreen from "./ui/SpamPauseScreen.svelte";
    import TapHints from "./ui/TapHints.svelte";

    const ANSWER_KEYS: Readonly<Record<string, Answer | undefined>> = {
        ArrowLeft: "true",
        ArrowRight: "false",
    };
    const FLASH_MS = 150;

    const storage = browserStorage();
    const rng = Math.random;

    // Game states are immutable, so raw state is enough: reactivity only on reassignment
    let game = $state.raw<GameState>(MENU);
    let now = $state(performance.now());
    let highscore = $state(loadHighscore(storage));
    let lastAnswer = $state.raw<{ answer: Answer; at: number } | null>(null);
    let width = $state(0);
    let height = $state(0);

    const flash = $derived(lastAnswer && now - lastAnswer.at < FLASH_MS ? lastAnswer.answer : null);

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

    function giveAnswer(input: Answer): void {
        const time = performance.now();
        lastAnswer = { answer: input, at: time };
        update(answer(game, input, time, rng));
    }

    function onKeydown(event: KeyboardEvent): void {
        // Held keys fire keydown repeatedly, that does not count as a new input
        if (event.repeat) return;

        const input = ANSWER_KEYS[event.key];
        if (input && game.phase === "playing") {
            event.preventDefault();
            giveAnswer(input);
        } else if (event.key === "Enter") {
            update(confirm(game, performance.now(), rng));
        }
    }

    // During a level the left half of the screen answers TRUE and the right half FALSE,
    // everywhere else a tap (or click) works like Enter
    function onPointerdown(event: PointerEvent): void {
        if (event.button !== 0) return;

        if (game.phase === "playing") {
            giveAnswer(event.clientX < width / 2 ? "true" : "false");
        } else {
            update(confirm(game, performance.now(), rng));
        }
    }

    // Leaving the tab or app must not cost the game: the timer stops until the player continues
    function onLeave(): void {
        update(pause(game, performance.now()));
    }
</script>

<svelte:window onkeydown={onKeydown} onpointerdown={onPointerdown} onblur={onLeave} />
<svelte:document
    onvisibilitychange={() => {
        if (document.hidden) onLeave();
    }}
/>

<main class="stage" bind:clientWidth={width} bind:clientHeight={height}>
    {#if game.phase === "menu"}
        <MenuScreen />
    {:else if game.phase === "playing"}
        <ChallengeScreen challenge={game.challenge} elapsed={now - game.startedAt} {width} {height} />
        <TapHints {flash} />
    {:else if game.phase === "spamPause"}
        <SpamPauseScreen {width} {height} />
    {:else if game.phase === "paused"}
        <PauseScreen />
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
        cursor: default;
        /* Fast tapping must not scroll, zoom, select text or show callouts and tap highlights */
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        -webkit-tap-highlight-color: transparent;
        /* Font size unit: 1 % of the width, capped by the height on very wide screens */
        --unit: min(1vw, 1.8dvh);
    }
</style>
