<script lang="ts">
    import Button from "./Button.svelte";

    interface Props {
        title: string;
        onback: () => void;
    }

    let { title, onback }: Props = $props();
</script>

<!-- The back button takes the focus, so keyboard players do not start over at the top of the page -->
<div class="head">
    <Button square aria-label="Back" onclick={onback} {@attach (node) => node.focus()}>◄</Button>
    <h1 class="title">{title}</h1>
</div>

<style>
    .head {
        --button-flex: none;
        --button-font: var(--text-medium);
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .title {
        margin: 0;
        font-size: max(18px, calc(2.6 * var(--unit)));
        font-weight: normal;
    }
</style>
