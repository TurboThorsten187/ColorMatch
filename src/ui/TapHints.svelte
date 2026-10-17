<script lang="ts">
    import type { Answer } from "../game/challenge.ts";

    interface Props {
        // The answer that was just given, lights up its label
        flash: Answer | null;
    }

    let { flash }: Props = $props();
</script>

<div class="hints" aria-hidden="true">
    <span class="hint" class:flash={flash === "true"}>← TRUE</span>
    <span class="hint" class:flash={flash === "false"}>FALSE →</span>
</div>

<style>
    .hints {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        display: grid;
        grid-template-columns: 1fr 1fr;
        justify-items: center;
        padding-bottom: calc(env(safe-area-inset-bottom) + 3vmin);
        pointer-events: none;
    }

    /* Semi-transparent pill, readable on every background color without drawing attention */
    .hint {
        font-size: max(14px, calc(2.5 * var(--unit)));
        padding: 0.35em 0.9em;
        border-radius: 999px;
        color: rgb(0 0 0 / 0.55);
        background: rgb(255 255 255 / 0.6);
        transition:
            color 150ms,
            background-color 150ms,
            transform 150ms;
    }

    .flash {
        color: #000;
        background: rgb(255 255 255 / 0.95);
        transform: scale(1.15);
    }
</style>
