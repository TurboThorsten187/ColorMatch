<script lang="ts">
    import type { Answer } from "../game/challenge.ts";

    interface Props {
        // The answer that was just given, lights up its label
        flash: Answer | null;
    }

    let { flash }: Props = $props();
</script>

<div class="hints" aria-hidden="true">
    <span class="hint" class:flash={flash === "true"}>◄ TRUE</span>
    <span class="hint" class:flash={flash === "false"}>FALSE ►</span>
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

    .flash {
        border-color: #fff;
        background: #fff;
        color: #000;
    }
</style>
