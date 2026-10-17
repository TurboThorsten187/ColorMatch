<script lang="ts">
    import TextLine from "./TextLine.svelte";
</script>

<TextLine y="calc(-3 * var(--unit))" size="calc(8 * var(--unit))" color="#000">Paused</TextLine>
<TextLine y="calc(5 * var(--unit))" size="max(12px, calc(3 * var(--unit)))" color="#000">
    (Tap or press Enter to continue)
</TextLine>
