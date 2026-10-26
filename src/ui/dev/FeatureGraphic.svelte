<script lang="ts">
    import { COLOR_CSS, COLORS } from "@/core/colors.ts";
    import Stage from "@/ui/Stage.svelte";

    // For the Play Store, on the dev server only (?featureGraphic): the 1024 x 500 feature graphic, which
    // `npm run store:listing` photographs. The title's letters take the game colors in their order, as in the menu.

    const TITLE = "COLORMATCH";
</script>

<Stage keys={false} hardcore={false} scanlines={true} keyHelp={false}>
    <div class="graphic" data-feature-graphic>
        <h1>
            {#each TITLE as letter, index (index)}<span style:color={COLOR_CSS[COLORS[index % COLORS.length]]}
                    >{letter}</span
                >{/each}
        </h1>
        <div class="blocks">
            {#each COLORS as color (color)}<span style:background={COLOR_CSS[color]}></span>{/each}
        </div>
        <p>DOES THE WORD MATCH ITS COLOR?</p>
    </div>
</Stage>

<style>
    .graphic {
        position: absolute;
        top: 0;
        left: 0;
        width: 1024px;
        height: 500px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 44px;
    }

    h1 {
        margin: 0;
        font-size: 64px;
        font-weight: normal;
        line-height: 1;
    }

    .blocks {
        display: flex;
        gap: 14px;
    }

    .blocks span {
        width: 48px;
        height: 48px;
    }

    p {
        margin: 0;
        font-size: 18px;
    }
</style>
