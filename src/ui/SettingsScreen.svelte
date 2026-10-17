<script lang="ts">
    import { COLOR_CSS } from "../game/colors.ts";
    import { changeVolume, type Settings, VOLUME_STEPS } from "../game/settings.ts";

    interface Props {
        settings: Settings;
        onchange: (next: Settings) => void;
        // Called once the reset button was held long enough
        onreset: () => void;
        onback: () => void;
    }

    let { settings, onchange, onreset, onback }: Props = $props();

    type Switch = "sound" | "scanlines";

    // Deleting everything must not happen by accident: the button has to be held this long
    const HOLD_MS = 1500;
    const CLEARED_MS = 1500;
    const STEPS = Array.from({ length: VOLUME_STEPS }, (_, i) => i + 1);

    let holdStart = $state<number | null>(null);
    let holdShare = $state(0);
    let cleared = $state(false);

    function stepColor(step: number): string {
        return step <= 3 ? COLOR_CSS.green : step <= 6 ? COLOR_CSS.yellow : COLOR_CSS.red;
    }

    function toggle(key: Switch, value: boolean): void {
        if (settings[key] !== value) onchange({ ...settings, [key]: value });
    }

    function startHold(): void {
        if (holdStart === null && !cleared) holdStart = performance.now();
    }

    function stopHold(): void {
        holdStart = null;
        holdShare = 0;
    }

    function onHoldPointer(event: PointerEvent): void {
        // Only the primary button, a held right click must not delete anything
        if (event.button === 0) startHold();
    }

    function onHoldKey(event: KeyboardEvent): void {
        if (event.key !== " " && event.key !== "Enter") return;
        event.preventDefault();
        if (!event.repeat) startHold();
    }

    $effect(() => {
        if (holdStart === null) return;
        const start = holdStart;
        let frame = requestAnimationFrame(function step(time) {
            holdShare = Math.min(1, Math.max(0, (time - start) / HOLD_MS));
            if (holdShare < 1) {
                frame = requestAnimationFrame(step);
                return;
            }
            stopHold();
            cleared = true;
            onreset();
        });
        return () => cancelAnimationFrame(frame);
    });

    $effect(() => {
        if (!cleared) return;
        const timeout = setTimeout(() => (cleared = false), CLEARED_MS);
        return () => clearTimeout(timeout);
    });
</script>

<!-- Leaving the window swallows the keyup or pointerup, so the hold has to end here too -->
<svelte:window onblur={stopHold} />
<svelte:document onvisibilitychange={stopHold} />

{#snippet onOff(key: Switch, labelId: string)}
    <div class="switch" role="group" aria-labelledby={labelId}>
        <button class:on={settings[key]} aria-pressed={settings[key]} onclick={() => toggle(key, true)}>ON</button>
        <button class:on={!settings[key]} aria-pressed={!settings[key]} onclick={() => toggle(key, false)}>OFF</button>
    </div>
{/snippet}

<div class="setup">
    <div class="head">
        <!-- Focus moves here so keyboard players do not start over at the top of the page -->
        <button class="square" aria-label="Back" onclick={onback} {@attach (node) => node.focus()}>◄</button>
        <h1 class="title">SETUP</h1>
    </div>

    <div class="options">
        <div class="row">
            <span id="sound-label">SOUND</span>
            {@render onOff("sound", "sound-label")}
        </div>

        <div class="volume">
            <span id="volume-label">VOLUME</span>
            <div class="volume-row">
                <button
                    class="square"
                    aria-label="Quieter"
                    disabled={settings.volume <= 1}
                    onclick={() => onchange(changeVolume(settings, -1))}>-</button
                >
                <div
                    class="steps"
                    role="meter"
                    aria-labelledby="volume-label"
                    aria-valuemin={1}
                    aria-valuemax={VOLUME_STEPS}
                    aria-valuenow={settings.volume}
                >
                    {#each STEPS as step (step)}
                        <div class="step" style:background={step <= settings.volume ? stepColor(step) : null}></div>
                    {/each}
                </div>
                <button
                    class="square"
                    aria-label="Louder"
                    disabled={settings.volume >= VOLUME_STEPS}
                    onclick={() => onchange(changeVolume(settings, 1))}>+</button
                >
            </div>
        </div>

        <div class="row">
            <span id="scanlines-label">SCANLINES</span>
            {@render onOff("scanlines", "scanlines-label")}
        </div>
    </div>

    <div class="reset">
        <!-- The button stays after the reset and only changes its label, so keyboard focus is not lost -->
        <button
            class="hold"
            class:cleared
            onpointerdown={onHoldPointer}
            onpointerup={stopHold}
            onpointerleave={stopHold}
            onpointercancel={stopHold}
            onkeydown={onHoldKey}
            onkeyup={stopHold}
            oncontextmenu={(event) => event.preventDefault()}
        >
            {#if cleared}
                DATA CLEARED
            {:else}
                HOLD TO RESET
                <!-- Inverted copy of the label, revealed from the left while holding -->
                <span class="fill" aria-hidden="true" style:clip-path="inset(0 {100 - holdShare * 100}% 0 0)"
                    >HOLD TO RESET</span
                >
            {/if}
        </button>
        <div class="note">HI-SCORE AND SETTINGS</div>
    </div>
</div>

<style>
    .setup {
        position: absolute;
        inset: 0;
        width: min(100%, 460px);
        margin: 0 auto;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: max(32px, calc(4 * var(--unit)));
        padding: calc(env(safe-area-inset-top) + max(40px, calc(5 * var(--unit)))) 24px
            calc(env(safe-area-inset-bottom) + max(40px, calc(5 * var(--unit))));
        font-size: max(11px, calc(1.6 * var(--unit)));
    }

    /* Phones in landscape: the reset button has to stay on screen */
    @media (max-height: 520px) {
        .setup {
            gap: 16px;
            padding-top: calc(env(safe-area-inset-top) + 16px);
            padding-bottom: calc(env(safe-area-inset-bottom) + 16px);
        }

        .options {
            gap: 14px;
        }
    }

    .head {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .title {
        margin: 0;
        font-size: max(18px, calc(2.6 * var(--unit)));
        font-weight: normal;
    }

    .options {
        display: flex;
        flex-direction: column;
        gap: 26px;
    }

    .row {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .volume {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .volume-row {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .steps {
        flex: 1;
        display: grid;
        grid-template-columns: repeat(8, minmax(0, 1fr));
        gap: 4px;
    }

    .step {
        height: 22px;
        background: #262626;
    }

    button {
        height: 44px;
        border: 3px solid #fff;
        border-radius: 0;
        background: #000;
        color: #fff;
        font-family: inherit;
        font-size: 10px;
        cursor: pointer;
    }

    button:disabled {
        opacity: 0.4;
        cursor: default;
    }

    button:focus-visible {
        outline: 3px solid #ffe14d;
        outline-offset: 4px;
    }

    .square {
        width: 44px;
        flex: none;
        font-size: 12px;
    }

    .switch {
        display: flex;
    }

    .switch button {
        width: 64px;
        border-color: #555;
        color: #777;
    }

    .switch button.on {
        border-color: #fff;
        background: #fff;
        color: #000;
    }

    .reset {
        margin-top: auto;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .hold {
        position: relative;
        height: 52px;
        overflow: hidden;
        border-color: #ff3b4e;
        color: #ff3b4e;
    }

    .fill {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        background: #ff3b4e;
        color: #000;
    }

    .hold.cleared {
        border-color: #3dff7a;
        color: #3dff7a;
        cursor: default;
    }

    .note {
        font-size: 8px;
        color: #999;
        text-align: center;
    }
</style>
