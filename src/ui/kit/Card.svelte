<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        // The id of the card's title
        labelledby: string;
        // A double frame in the accent instead of a white one
        double?: boolean;
        // A hard blue shadow, like a sheet lying on the screen
        shadow?: boolean;
        children: Snippet;
    }

    let { labelledby, double = false, shadow = false, children }: Props = $props();
</script>

<!-- As wide as its place; a screen changes the spacing with --card-gap and --card-padding around it -->
<div class="card" class:double class:shadow role="dialog" aria-labelledby={labelledby}>
    {@render children()}
</div>

<style>
    .card {
        width: 100%;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: var(--card-gap, 18px);
        padding: var(--card-padding, 22px);
        border: var(--line-bold) solid #fff;
        background: #000;
    }

    .double {
        border: var(--line-bold) double var(--accent);
    }

    .shadow {
        box-shadow: 6px 6px 0 var(--blue);
    }
</style>
