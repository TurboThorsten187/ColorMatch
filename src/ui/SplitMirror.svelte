<script lang="ts">
    import type { Snippet } from "svelte";
    import type { Color } from "../game/colors.ts";
    import { inkStyle } from "./shapes.ts";

    interface Props {
        // The ink of the text, or null when its letters carry their own
        ink: Color | null;
        colorblind: boolean;
        // The word, drawn twice
        children: Snippet;
    }

    let { ink, colorblind, children }: Props = $props();
</script>

<!-- SPLIT MIRROR: the left half of the word, and the same half mirrored onto the right. The loss animation draws each
     piece with data-ink in its ink, cut to the left half of the closest element with data-left-half. -->
<span class="half" data-ink={ink} data-left-half style={ink ? inkStyle(ink, colorblind) : null}
    >{@render children()}</span
>
<span class="half mirrored" data-ink={ink} data-left-half style={ink ? inkStyle(ink, colorblind) : null}
    >{@render children()}</span
>

<style>
    /* Only what is left of the middle shows, also letters of ASSEMBLE still flying in from far above or below */
    .half {
        position: relative;
        display: block;
        clip-path: polygon(-1000% -1000%, 50% -1000%, 50% 1100%, -1000% 1100%);
    }

    /* Lies on the first half and turns around the middle of the word, where the cut is */
    .mirrored {
        position: absolute;
        left: 0;
        top: 0;
        transform: scaleX(-1);
    }
</style>
