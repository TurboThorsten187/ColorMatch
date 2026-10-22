<script lang="ts">
    import type { Answer } from "@/core/challenge.ts";
    import { LOW_TIME_SHARE, type PlayingState, remainingShare } from "@/core/game.ts";
    import { isNegative } from "@/modifiers/negative/look.ts";
    import { lowTimeGlow } from "@/ui/hud/lowTimeGlow.ts";
    import TapHints from "@/ui/hud/TapHints.svelte";
    import TopBar from "@/ui/hud/TopBar.svelte";
    import WordView from "@/ui/word/WordView.svelte";

    interface Props {
        // The playing level, or the solved SPAM! level frozen at its last press
        level: PlayingState;
        // The time the level is drawn at
        time: number;
        highscore: number;
        width: number;
        height: number;
        colorblind: boolean;
        flipControls: boolean;
        // The answer just given, its hint lights up
        flash: Answer | null;
    }

    let { level, time, highscore, width, height, colorblind, flipControls, flash }: Props = $props();

    const has = (id: "countUp" | "doubleTap" | "negative"): boolean => level.challenge.modifiers.has(id);
    const elapsed = $derived(time - level.startedAt);
    const remaining = $derived(remainingShare(level, time));
    // NEGATIVE turns the whole level into its photo negative for a while, the timer and the hints too
    const negative = $derived(has("negative") && isNegative(elapsed, level.timeLimit));
</script>

<div class="playfield" style:filter={negative ? "invert(1)" : null}>
    <WordView
        challenge={level.challenge}
        {elapsed}
        timeLimit={level.timeLimit}
        spamCount={level.spamCount}
        {width}
        {height}
        {colorblind}
    />
    <TopBar level={level.level} {highscore} {remaining} countUp={has("countUp")} />
    <TapHints {flash} double={has("doubleTap")} {flipControls} />
</div>
<!-- Outside of the playfield, so NEGATIVE does not turn it cyan -->
<div class="low-time" style:opacity={lowTimeGlow(remaining, LOW_TIME_SHARE)} aria-hidden="true"></div>

<style>
    .playfield {
        position: absolute;
        inset: 0;
    }

    /* LOW TIME: a glowing red frame, its opacity comes from lowTimeGlow */
    .low-time {
        position: absolute;
        inset: 0;
        pointer-events: none;
        box-shadow:
            inset 0 0 0 6px var(--red),
            inset 0 0 28px 10px color-mix(in srgb, var(--red) 75%, transparent);
    }
</style>
