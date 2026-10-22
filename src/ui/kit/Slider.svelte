<script lang="ts">
    import { sideOfKey } from "@/app/keys.ts";
    import Button from "./Button.svelte";

    interface Props {
        // From 1 to `steps`
        value: number;
        steps: number;
        // The id of the label that names it
        labelledby: string;
        // The color of a lit step
        colorOf: (step: number) => string;
        // What the buttons beside the bar say to screen readers
        lessLabel: string;
        moreLabel: string;
        onchange: (value: number) => void;
    }

    let { value, steps, labelledby, colorOf, lessLabel, moreLabel, onchange }: Props = $props();

    const STEPS = $derived(Array.from({ length: steps }, (_, i) => i + 1));

    function change(delta: number): void {
        const next = Math.min(steps, Math.max(1, value + delta));
        if (next !== value) onchange(next);
    }

    // Left and right change it while it is selected
    function onkeydown(event: KeyboardEvent): void {
        const side = sideOfKey(event.key);
        if (!side) return;
        // Tells the arrow navigation in App that the key is used up
        event.preventDefault();
        change(side === "left" ? -1 : 1);
    }
</script>

<div class="slider">
    <!-- For mouse and touch, the keyboard uses the bar itself -->
    <Button square instant aria-label={lessLabel} tabindex={-1} disabled={value <= 1} onclick={() => change(-1)}
        >-</Button
    >
    <div
        class="steps"
        style:--steps={steps}
        role="slider"
        tabindex="0"
        aria-labelledby={labelledby}
        aria-valuemin={1}
        aria-valuemax={steps}
        aria-valuenow={value}
        {onkeydown}
    >
        {#each STEPS as step (step)}
            <div class="step" style:background={step <= value ? colorOf(step) : null}></div>
        {/each}
    </div>
    <Button square instant aria-label={moreLabel} tabindex={-1} disabled={value >= steps} onclick={() => change(1)}
        >+</Button
    >
</div>

<style>
    .slider {
        --button-flex: none;
        --button-font: var(--text-medium);
        display: flex;
        align-items: center;
        gap: 10px;
    }

    /* The border shows the keyboard selection */
    .steps {
        flex: 1;
        display: grid;
        grid-template-columns: repeat(var(--steps), minmax(0, 1fr));
        gap: 4px;
        padding: 3px;
        border: var(--line) solid transparent;
    }

    .step {
        height: 22px;
        background: var(--fill-off);
    }
</style>
