<script lang="ts">
    import { fitScale } from "./fitText.ts";
    import TextLine from "./TextLine.svelte";

    interface Props {
        width: number;
        height: number;
    }

    let { width, height }: Props = $props();

    const TEXT = "Stop spamming!";

    const fontSize = $derived.by(() => {
        const size = height * 0.18;
        return size * fitScale([{ text: TEXT, fontSize: size }], width * 0.9);
    });
</script>

<TextLine y="0px" size="{fontSize}px" color="black">{TEXT}</TextLine>
