<script lang="ts">
    import type { Award, AwardKind } from "../game/awards.ts";
    import { type Color, COLOR_CSS } from "../game/colors.ts";

    interface Props {
        award: Award;
        locked?: boolean;
    }

    let { award, locked = false }: Props = $props();

    const KIND_COLORS: Readonly<Record<AwardKind, Color>> = {
        milestone: "green",
        surge: "purple",
        rule: "yellow",
        look: "blue",
    };
</script>

<!-- Fills the width of its container, the font size comes from the parent -->
<span class="badge" class:locked style:--badge-color={COLOR_CSS[KIND_COLORS[award.kind]]}>{award.code}</span>

<style>
    .badge {
        width: 100%;
        aspect-ratio: 1;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid var(--badge-color);
        color: var(--badge-color);
    }

    .locked {
        border-color: #333;
        color: #555;
    }
</style>
