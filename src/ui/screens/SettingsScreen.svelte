<script lang="ts">
    import { COLOR_CSS } from "@/core/colors.ts";
    import { type Settings, VOLUME_STEPS } from "@/core/settings.ts";
    import Button from "@/ui/kit/Button.svelte";
    import Screen from "@/ui/kit/Screen.svelte";
    import ScreenHead from "@/ui/kit/ScreenHead.svelte";
    import Slider from "@/ui/kit/Slider.svelte";
    import Toggle from "@/ui/kit/Toggle.svelte";

    interface Props {
        settings: Settings;
        onchange: (next: Settings) => void;
        // Called once the reset button was held long enough
        onreset: () => void;
        // Shows the how-to-play cards and the practice again
        onreplay: () => void;
        onback: () => void;
    }

    let { settings, onchange, onreset, onreplay, onback }: Props = $props();

    type Switch = "sound" | "scanlines" | "colorblind" | "flipControls";

    // Deleting everything must not happen by accident: the button has to be held this long
    const HOLD_MS = 1500;
    const CLEARED_MS = 1500;

    let holdStart = $state<number | null>(null);
    let holdShare = $state(0);
    let cleared = $state(false);

    function stepColor(step: number): string {
        return step <= 3 ? COLOR_CSS.green : step <= 6 ? COLOR_CSS.yellow : COLOR_CSS.red;
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
    <Toggle value={settings[key]} labelledby={labelId} onchange={(value) => onchange({ ...settings, [key]: value })} />
{/snippet}

<Screen scroll narrow>
    <div class="setup">
        <ScreenHead title="SETTINGS" {onback} />

        <div class="options">
            <div class="row">
                <span id="sound-label">SOUND</span>
                {@render onOff("sound", "sound-label")}
            </div>

            <div class="volume">
                <span id="volume-label">VOLUME</span>
                <Slider
                    value={settings.volume}
                    steps={VOLUME_STEPS}
                    labelledby="volume-label"
                    colorOf={stepColor}
                    lessLabel="Quieter"
                    moreLabel="Louder"
                    onchange={(volume) => onchange({ ...settings, volume })}
                />
            </div>

            <div class="row">
                <span id="scanlines-label">SCANLINES</span>
                {@render onOff("scanlines", "scanlines-label")}
            </div>

            <div class="row">
                <span id="colorblind-label">COLORBLIND</span>
                {@render onOff("colorblind", "colorblind-label")}
            </div>

            <div class="row">
                <span id="flip-controls-label">FLIP CONTROLS</span>
                {@render onOff("flipControls", "flip-controls-label")}
            </div>

            <div class="row replay">
                <span id="tutorial-label">TUTORIAL</span>
                <Button color="var(--blue)" aria-describedby="tutorial-label" onclick={onreplay}>REPLAY</Button>
            </div>
        </div>

        <div class="reset">
            <!-- The button stays after the reset and only changes its label, so keyboard focus is not lost -->
            <!-- Its fill is the feedback, so it is no Button that gives way first -->
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
            <div class="note">HI-SCORE, STATS, AWARDS AND SETTINGS</div>
        </div>
    </div>
</Screen>

<style>
    .setup {
        --row: 44px;
        --row-gap: 26px;
        --volume-gap: 12px;
        --space: max(32px, calc(4 * var(--unit)));
        --top: max(40px, calc(5 * var(--unit)));
        --hold: 52px;
        --button-height: var(--row);
        display: flex;
        flex-direction: column;
        gap: var(--space);
        padding: var(--top) 24px 0;
        font-size: max(11px, calc(1.6 * var(--unit)));
    }

    /* Lower browser windows: rows and spacing shrink with the height, so the page fits without scrolling down to a
       height of about 560 px */
    @media (max-height: 820px) {
        .setup {
            --row: clamp(38px, 6.6dvh, 44px);
            --row-gap: clamp(6px, 1.8dvh, 26px);
            --volume-gap: clamp(6px, 1.2dvh, 12px);
            --space: clamp(10px, 3dvh, 32px);
            --top: clamp(14px, 3.4dvh, 40px);
        }
    }

    .options {
        display: flex;
        flex-direction: column;
        gap: var(--row-gap);
    }

    .row {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .volume {
        display: flex;
        flex-direction: column;
        gap: var(--volume-gap);
    }

    .replay {
        --button-width: 128px;
    }

    .reset {
        margin-top: auto;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .hold {
        --button-color: var(--red);
        position: relative;
        height: var(--hold);
        overflow: hidden;
        border: var(--line) solid #fff;
        border-radius: 0;
        background: #000;
        color: var(--red);
        font-family: inherit;
        font-size: var(--text-small);
        cursor: pointer;
    }

    .fill {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        background: var(--red);
        color: #000;
    }

    .hold.cleared {
        border-color: var(--green);
        color: var(--green);
        cursor: default;
    }

    .note {
        font-size: var(--text-tiny);
        line-height: 1.8;
        color: var(--text-note);
        text-align: center;
    }

    /* Phones in landscape: the reset button has to stay on screen */
    @media (max-height: 520px) {
        .setup {
            --row: 38px;
            --row-gap: 10px;
            --volume-gap: 8px;
            --space: 12px;
            --top: 16px;
            --hold: 44px;
            padding-bottom: 16px;
        }
    }
</style>
