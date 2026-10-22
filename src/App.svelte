<script lang="ts">
    import { directionOfKey, isBackKey, sideOfKey } from "@/app/keys.ts";
    import { Session } from "@/app/session.svelte.ts";
    import { currentStep } from "@/core/tutorial.ts";
    import { configureSound, unlockAudio } from "@/platform/sound.ts";
    import { browserStorage } from "@/platform/storage.ts";
    import { testRng } from "@/platform/testRng.ts";
    import { focusHovered, moveFocus } from "@/ui/focus.ts";
    import Screens from "@/ui/Screens.svelte";
    import { showsLoss } from "@/ui/screens/lossAnimation.ts";
    import { playEvent } from "@/ui/sounds.ts";
    import Stage from "@/ui/Stage.svelte";

    // The browser side of the game: the session with its storage, clock, sounds and frames, the keyboard and pointer
    // input, and the stage that ui/Screens.svelte draws the current screen on

    const session = new Session({
        storage: browserStorage(),
        rng: testRng() ?? Math.random,
        clock: () => performance.now(),
        onEvent: playEvent,
        onSettings: configureSound,
    });

    let width = $state(0);
    let height = $state(0);
    let stage = $state<HTMLElement>();
    // The selected button is highlighted only while playing with the keyboard
    let keyboardMode = $state(false);

    // The keys hint only shows on screens with buttons, never while a word waits for an answer
    const showsButtons = $derived.by(() => {
        const { game, now } = session;
        if (session.view !== "game") return true;
        if (session.tutorial) return currentStep(session.tutorial)?.kind === "card";
        if (game.phase === "gameOver") return !showsLoss(game, now);
        return game.phase === "menu" || (game.phase === "paused" && session.intros.length > 0);
    });

    $effect(() => {
        let frame = requestAnimationFrame(function loop(time) {
            // Asked for first, so an error in one frame cannot stop the game for good
            frame = requestAnimationFrame(loop);
            session.frame(time);
        });
        return () => cancelAnimationFrame(frame);
    });

    // When the key or finger went down, not when the handler runs a moment later. Falls back to now for events
    // without a usable time stamp.
    function pressTime(event: Event): number {
        const time = performance.now();
        return event.timeStamp > 0 && event.timeStamp <= time ? event.timeStamp : time;
    }

    function onKeydown(event: KeyboardEvent): void {
        unlockAudio();
        // Held keys fire keydown repeatedly, that does not count as a new input
        if (!event.repeat) handleKey(event);
        // Afterwards, so the first arrow key only shows the selection
        keyboardMode = true;
    }

    function handleKey(event: KeyboardEvent): void {
        const side = sideOfKey(event.key);
        if (side && session.answers) {
            event.preventDefault();
            session.side(side, pressTime(event));
        } else if (session.intros.length > 0) {
            // A modifier card has only GOT IT, which handles Enter itself; the arrow keys scroll the card
            if (event.key === "Enter" && !(event.target instanceof HTMLButtonElement)) session.gotIt();
        } else if (navigate(event)) {
            return;
        } else if (isBackKey(event.key)) {
            session.back();
        } else if (event.key === "Enter" && !(event.target instanceof HTMLButtonElement)) {
            // A focused button handles Enter itself (MENU must not retry). Without a default the same Enter cannot
            // press a button that the next screen focuses right away either.
            event.preventDefault();
            session.enter();
        }
    }

    // Arrow keys and WASD outside of a level move the selection; returns whether the key was one of them
    function navigate(event: KeyboardEvent): boolean {
        const direction = directionOfKey(event.key);
        if (!direction) return false;
        // The volume bar used left or right itself
        if (event.defaultPrevented) return true;
        event.preventDefault();
        if (stage && moveFocus(stage, direction, keyboardMode)) playEvent({ kind: "move" });
        return true;
    }

    // During a level the left half of the screen answers TRUE and the right half FALSE, or the other way round with
    // FLIP CONTROLS
    function onPointerdown(event: PointerEvent): void {
        unlockAudio();
        keyboardMode = false;
        // Buttons handle their own clicks, e.g. SETTINGS in the menu must not start a game
        if (event.button !== 0 || (event.target instanceof Element && event.target.closest("button"))) return;
        session.tap(event.clientX < width / 2 ? "left" : "right", pressTime(event));
    }

    function onPointermove(event: PointerEvent): void {
        if (stage && focusHovered(event, stage)) keyboardMode = true;
    }
</script>

<!-- On touch screens only pointerup counts as a gesture that may start audio -->
<svelte:window
    onkeydown={onKeydown}
    onpointerdown={onPointerdown}
    onpointermove={onPointermove}
    onpointerup={unlockAudio}
    onblur={() => session.leave()}
    onstorage={() => session.reload()}
/>
<svelte:document
    onvisibilitychange={() => {
        if (document.hidden) session.leave();
    }}
/>

<Stage
    keys={keyboardMode}
    hardcore={session.mode === "hardcore"}
    scanlines={session.settings.scanlines}
    keyHelp={keyboardMode && showsButtons}
    bind:element={stage}
    bind:width
    bind:height
>
    <Screens {session} {width} {height} />
</Stage>
