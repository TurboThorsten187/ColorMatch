<script lang="ts">
    import type { Snippet } from "svelte";
    import type { HTMLButtonAttributes } from "svelte/elements";

    interface Props extends Omit<HTMLButtonAttributes, "onclick" | "color"> {
        onclick?: () => void;
        // small: 44 px high with a thin frame, large: 56 px with a bold one. A screen changes a size with the CSS
        // variables --button-height, --button-width, --button-flex, --button-font and --button-padding on a
        // surrounding element.
        size?: "small" | "large";
        // As wide as high, for icons like ◄
        square?: boolean;
        // The color the button is selected and pressed in, the accent without one
        color?: string;
        // Text and frame in a color instead of white
        ink?: string;
        line?: string;
        // Acts at once, for buttons that change something on the same screen: there is nothing the press could miss,
        // and leaving the screen right after must not lose it
        instant?: boolean;
        children: Snippet;
    }

    let {
        onclick,
        size = "small",
        square = false,
        color,
        ink,
        line,
        instant = false,
        children,
        ...rest
    }: Props = $props();

    // A pressed button gives way this long before it acts, so the press can be seen even when the screen changes
    // right after
    const PRESS_MS = 120;

    let element = $state<HTMLButtonElement>();
    let pressed = $state(false);

    // By tap, click, Enter or Space; more presses while it gives way do nothing
    function press(): void {
        if (instant) onclick?.();
        if (pressed) return;
        pressed = true;
        setTimeout(() => {
            pressed = false;
            if (!instant && element?.isConnected && !element.disabled) onclick?.();
        }, PRESS_MS);
    }
</script>

<!-- The stage colors frame and text of the selected and the pressed (data-press) button in --button-color -->
<button
    {...rest}
    bind:this={element}
    class:large={size === "large"}
    class:square
    style:--button-color={color}
    style:--button-ink={ink}
    style:--button-line={line}
    data-press={pressed ? "" : undefined}
    onclick={press}>{@render children()}</button
>

<style>
    button {
        --height: 44px;
        --frame: var(--line);
        --font: var(--text-small);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        box-sizing: border-box;
        flex: var(--button-flex, 0 1 auto);
        width: var(--button-width, auto);
        height: var(--button-height, var(--height));
        padding: var(--button-padding, 0 16px);
        border: var(--frame) solid var(--button-line, #fff);
        border-radius: 0;
        background: #000;
        color: var(--button-ink, #fff);
        font-family: inherit;
        font-size: var(--button-font, var(--font));
        cursor: pointer;
    }

    .large {
        --height: 56px;
        --frame: var(--line-bold);
        --font: var(--text-large);
    }

    .square {
        width: var(--button-height, var(--height));
        padding: 0;
    }

    button:disabled {
        opacity: 0.4;
        cursor: default;
    }

    /* Locked: it can still be selected and pressed, to tell what opens it */
    button[aria-disabled="true"] {
        border-color: var(--line-locked);
        color: var(--text-locked);
        cursor: default;
    }
</style>
