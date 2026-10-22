<script lang="ts">
    import Button from "./Button.svelte";

    interface Props {
        value: boolean;
        // The id of the label that names the setting
        labelledby: string;
        onchange: (value: boolean) => void;
    }

    let { value, labelledby, onchange }: Props = $props();
</script>

<!-- ON and OFF side by side, the one that holds is lit -->
<div class="toggle" role="group" aria-labelledby={labelledby}>
    {#each [true, false] as option (option)}
        <Button
            instant
            aria-pressed={value === option}
            ink={value === option ? undefined : "var(--text-off)"}
            line={value === option ? undefined : "var(--line-off)"}
            onclick={() => {
                if (value !== option) onchange(option);
            }}>{option ? "ON" : "OFF"}</Button
        >
    {/each}
</div>

<style>
    .toggle {
        --button-width: 64px;
        display: flex;
    }
</style>
