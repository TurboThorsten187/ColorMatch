<script lang="ts">
    import type { Answer } from "../game/challenge.ts";
    import { answerOn } from "../game/settings.ts";

    interface Props {
        // The answer that was just given, lights up its label
        flash: Answer | null;
        // The tutorial points at the right answer
        highlight?: Answer | null;
        // DOUBLE TAP: double arrows as a reminder to tap twice
        double?: boolean;
        // FALSE on the left, TRUE on the right
        flipControls: boolean;
    }

    let { flash, highlight = null, double = false, flipControls }: Props = $props();

    const left = $derived(answerOn("left", flipControls));
    const right = $derived(answerOn("right", flipControls));
    const leftArrow = $derived(double ? "◄◄" : "◄");
    const rightArrow = $derived(double ? "►►" : "►");
</script>

<div class="hints" aria-hidden="true">
    <span class="hint" class:flash={flash === left} class:highlight={highlight === left}>
        {leftArrow}
        {left.toUpperCase()}
    </span>
    <span class="hint" class:flash={flash === right} class:highlight={highlight === right}>
        {right.toUpperCase()}
        {rightArrow}
    </span>
</div>

<style>
    .hints {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        justify-content: space-between;
        padding: 0 24px calc(env(safe-area-inset-bottom) + 24px);
        pointer-events: none;
    }

    .hint {
        padding: 12px;
        border: 3px solid #555;
        background: #000;
        color: #bbb;
        font-size: max(12px, calc(1.6 * var(--unit)));
        transition:
            color 150ms,
            background-color 150ms,
            border-color 150ms;
    }

    .highlight {
        border-color: var(--accent);
        color: var(--accent);
        animation: blink 1s steps(1) infinite;
    }

    .flash {
        border-color: #fff;
        background: #fff;
        color: #000;
        animation: none;
    }

    @keyframes blink {
        50% {
            opacity: 0;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .highlight {
            animation: none;
        }
    }
</style>
