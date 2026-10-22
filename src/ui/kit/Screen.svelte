<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        // Taller content scrolls instead of being cut off
        scroll?: boolean;
        // A column of at most 460 px in the middle
        narrow?: boolean;
        children: Snippet;
    }

    let { scroll = false, narrow = false, children }: Props = $props();
</script>

<!-- A whole screen inside the safe area, with room at the bottom for the stage's key help strip. Its content fills at
     least the whole height, so it can push something to the bottom with margin-top: auto. -->
<div class="screen" class:scroll class:narrow>
    {@render children()}
</div>

<style>
    .screen {
        position: absolute;
        inset: 0;
        box-sizing: border-box;
        padding-top: env(safe-area-inset-top);
        padding-bottom: calc(env(safe-area-inset-bottom) + var(--key-help-room));
    }

    .screen > :global(*) {
        min-height: 100%;
        box-sizing: border-box;
    }

    /* The stage blocks touch gestures, a scrolling screen takes vertical swipes */
    .scroll {
        overflow-y: auto;
        touch-action: pan-y;
        scrollbar-width: thin;
        scrollbar-color: var(--line-off) #000;
    }

    .narrow {
        width: min(100%, 460px);
        margin: 0 auto;
    }
</style>
