<script lang="ts">
    import type { Color } from "../game/colors.ts";
    import { inkStyle } from "./shapes.ts";

    interface Props {
        text: string;
        color: Color;
        colorblind: boolean;
    }

    let { text, color, colorblind }: Props = $props();
</script>

<!-- SPLIT MIRROR: the left half of the word, and the same half mirrored onto the right. The loss animation draws each
     piece with data-ink in its ink, cut to its left half with data-left-half. -->
<span class="half" data-ink={color} data-left-half style={inkStyle(color, colorblind)}>{text}</span>
<span class="half mirrored" data-ink={color} data-left-half style={inkStyle(color, colorblind)}>{text}</span>

<style>
    .half {
        display: block;
        clip-path: inset(0 50% 0 0);
    }

    /* Lies on the first half and turns around the middle of the word, where the cut is */
    .mirrored {
        position: absolute;
        left: 0;
        top: 0;
        transform: scaleX(-1);
    }
</style>
