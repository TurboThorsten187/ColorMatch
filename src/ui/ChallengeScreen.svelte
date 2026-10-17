<script lang="ts">
    import type { Challenge } from "../game/challenge.ts";
    import { COLOR_CSS } from "../game/colors.ts";
    import type { ModifierId } from "../game/modifiers.ts";
    import { fitScale } from "./fitText.ts";
    import TextLine from "./TextLine.svelte";

    interface Props {
        challenge: Challenge;
        // Time since the challenge appeared in ms
        elapsed: number;
        width: number;
        height: number;
    }

    let { challenge, elapsed, width, height }: Props = $props();

    const BLINK_VISIBLE_MS = 500;

    const has = (id: ModifierId): boolean => challenge.modifiers.has(id);

    const blinkedOut = $derived(has("blink") && elapsed > BLINK_VISIBLE_MS);
    const mainText = $derived(has("spam") ? "Spam!" : capitalize(challenge.word));
    const textsAbove = $derived(has("invertColors") ? ["Inverted Colors!"] : []);
    const textsBelow = $derived([
        ...(has("noClick") ? ["Don't Click!"] : []),
        ...(has("invertInput") ? ["Inverted Input!"] : []),
    ]);

    // Font sizes relative to the height, shrunk to fit narrow (or rotated) screens
    const sizes = $derived.by(() => {
        const main = height * 0.24;
        const sub = height * 0.12;
        const maxWidth = 0.9 * (has("rotation") ? Math.min(width, height) : width);
        const scale = fitScale(
            [
                { text: mainText, fontSize: main },
                ...[...textsAbove, ...textsBelow].map((text) => ({ text, fontSize: sub })),
            ],
            maxWidth,
        );
        return { main: main * scale, sub: sub * scale, spacing: sub * scale * 1.25 };
    });

    const transform = $derived(
        `rotate(${challenge.rotationDeg}deg) scale(${has("mirrorHorizontal") ? -1 : 1}, ${has("mirrorVertical") ? -1 : 1})`,
    );

    function capitalize(text: string): string {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }
</script>

{#if !blinkedOut}
    <div
        class="screen"
        class:inverted={has("invertColors")}
        style:background={challenge.background ? COLOR_CSS[challenge.background] : "white"}
    >
        <div
            class="anchor"
            style:transform
            style:filter={has("blur") ? "blur(10px)" : null}
            style:color={COLOR_CSS[challenge.color]}
        >
            {#each textsAbove as text, i (text)}
                <TextLine y="{-sizes.main - i * sizes.spacing}px" size="{sizes.sub}px">{text}</TextLine>
            {/each}
            <TextLine y="0px" size="{sizes.main}px">{mainText}</TextLine>
            {#each textsBelow as text, i (text)}
                <TextLine y="{sizes.main + i * sizes.spacing}px" size="{sizes.sub}px">{text}</TextLine>
            {/each}
        </div>
    </div>
{/if}

<style>
    .screen {
        position: absolute;
        inset: 0;
    }

    /* Zero-size point in the center that all transformations pivot around */
    .anchor {
        position: absolute;
        left: 50%;
        top: 50%;
    }

    .inverted {
        filter: invert(1);
    }
</style>
