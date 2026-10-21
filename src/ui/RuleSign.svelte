<script lang="ts">
    import { ICON_SIZE, type PixelIcon, pixelsOf } from "./ruleIcons.ts";

    interface Props {
        icon: PixelIcon;
        text: string;
        // BLURRED blurs the sign along with the word
        filter?: string | null;
    }

    let { icon, text, filter = null }: Props = $props();

    const pixels = $derived(pixelsOf(icon));
</script>

{#snippet pixelIcon(mirrored: boolean)}
    <svg class="icon" class:mirrored viewBox="0 0 {ICON_SIZE} {ICON_SIZE}" aria-hidden="true">
        {#each pixels as pixel, index (index)}
            <rect x={pixel.x} y={pixel.y} width="1" height="1" />
        {/each}
    </svg>
{/snippet}

<!-- A rule sign: white with black text, the rule's icon at both ends -->
<span class="sign" style:filter>
    {@render pixelIcon(false)}{text}{@render pixelIcon(icon.directed)}
</span>

<style>
    .sign {
        display: inline-flex;
        align-items: center;
        gap: 0.7em;
        padding: 8px 10px;
        background: #fff;
        color: #000;
        white-space: nowrap;
    }

    .icon {
        width: 1.25em;
        height: 1.25em;
        flex: none;
        fill: currentColor;
        shape-rendering: crispEdges;
    }

    .mirrored {
        transform: scaleX(-1);
    }
</style>
