<script lang="ts">
    import { AWARDS } from "@/core/awards.ts";
    import AwardBadge from "@/ui/hud/AwardBadge.svelte";

    // For the Play Console, on the dev server only (?awardIcons): every award as a 512 x 512 achievement icon, which
    // `npm run store:achievements` photographs. The margin keeps the whole badge inside the circle Android lays over
    // an achievement toast.
</script>

<div class="icons">
    {#each AWARDS as award (award.id)}
        <div class="icon" data-award={award.id} data-name={award.name} data-rule={award.rule}>
            <AwardBadge {award} />
        </div>
    {/each}
</div>

<style>
    .icons {
        position: absolute;
        top: 0;
        left: 0;
        display: grid;
        grid-template-columns: repeat(6, 512px);
    }

    .icon {
        --line: 24px;
        width: 512px;
        height: 512px;
        box-sizing: border-box;
        padding: 80px;
        display: flex;
        background: #000;
        font-family: "Press Start 2P", monospace;
        font-size: 88px;
    }
</style>
