<script lang="ts">
    import TextLine from "./TextLine.svelte";

    interface Props {
        score: number;
        highscore: number;
    }

    let { score, highscore }: Props = $props();
</script>

<TextLine y="calc(-8 * var(--unit))" size="calc(8 * var(--unit))" color="#000">Game Over</TextLine>
<TextLine y="calc(-0.5 * var(--unit))" size="calc(4 * var(--unit))" color="#000">Score: {score}</TextLine>
<TextLine y="calc(4.5 * var(--unit))" size="calc(4 * var(--unit))" color="#000">Highscore: {highscore}</TextLine>
<TextLine y="calc(11 * var(--unit))" size="calc(3 * var(--unit))" color="#000">(Press Enter to try again)</TextLine>
