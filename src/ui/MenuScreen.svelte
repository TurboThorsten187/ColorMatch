<script lang="ts">
    import { COLOR_CSS, randomColor } from "../game/colors.ts";
    import TextLine from "./TextLine.svelte";

    const TITLE = "ColorMatch";
    const COLOR_CHANGE_MS = 150;
    // Svelte collapses whitespace in markup, the gap between the two labels is intended
    const CONTROLS = "← TRUE         FALSE →";

    // Every letter has its own color, one random letter changes regularly
    const titleColors = $state(Array.from(TITLE, () => randomColor(Math.random)));

    $effect(() => {
        const interval = setInterval(() => {
            titleColors[Math.floor(Math.random() * TITLE.length)] = randomColor(Math.random);
        }, COLOR_CHANGE_MS);
        return () => clearInterval(interval);
    });
</script>

<TextLine y="-10%" size="calc(10 * var(--unit))">
    <span class="title">
        {#each TITLE as letter, i (i)}
            <span style:color={COLOR_CSS[titleColors[i]]}>{letter}</span>
        {/each}
    </span>
</TextLine>
<TextLine y="10%" size="calc(4 * var(--unit))" color="#000">{CONTROLS}</TextLine>
<TextLine y="18%" size="calc(3 * var(--unit))" color="#333">(Press Enter to start)</TextLine>

<style>
    .title {
        display: flex;
        gap: calc(0.8 * var(--unit));
        font-family: monospace;
    }
</style>
