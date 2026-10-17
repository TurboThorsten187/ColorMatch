<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        // Vertical offset of the line's center from the center of the containing block
        y: string;
        size: string;
        color?: string;
        children: Snippet;
    }

    let { y, size, color, children }: Props = $props();
</script>

<div class="line" style:top="calc(50% + {y})" style:font-size={size} style:color>
    {@render children()}
</div>

<style>
    .line {
        position: absolute;
        left: 50%;
        transform: translate(-50%, -50%);
        line-height: 1;
        white-space: pre;
    }
</style>
