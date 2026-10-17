<script lang="ts">
    import type { Answer, Challenge } from "../game/challenge.ts";
    import { type Color, COLOR_CSS } from "../game/colors.ts";
    import {
        currentStep,
        expectedAnswer,
        PRACTICE_WORDS,
        TUTORIAL_CARDS,
        type TutorialState,
    } from "../game/tutorial.ts";
    import ChallengeScreen from "./ChallengeScreen.svelte";
    import TapHints from "./TapHints.svelte";

    interface Props {
        tutorial: TutorialState;
        // The answer that was just given, lights up its label
        flash: Answer | null;
        width: number;
        height: number;
        onnext: () => void;
        onskip: () => void;
    }

    let { tutorial, flash, width, height, onnext, onskip }: Props = $props();

    const CARD_DOTS = Array.from({ length: TUTORIAL_CARDS }, (_, i) => i);
    const TIMER_SEGMENTS = Array.from({ length: 10 }, (_, i) => i);
    const TIMER_LIT = 6;

    const step = $derived(currentStep(tutorial));
    const practice = $derived(step?.kind === "try" ? PRACTICE_WORDS[step.practice] : null);
    const expected = $derived(practice ? expectedAnswer(practice) : null);
    const challenge = $derived<Challenge | null>(
        practice && expected
            ? {
                  word: practice.word,
                  color: practice.color,
                  modifiers: new Set(),
                  expected,
                  background: null,
                  rotationDeg: 0,
              }
            : null,
    );
</script>

{#snippet colorName(color: Color)}
    <span style:color={COLOR_CSS[color]}>{color.toUpperCase()}</span>
{/snippet}

{#if step?.kind === "card"}
    <div class="dimmed" aria-hidden="true">RED</div>
    <div class="shade"></div>
    <div class="card" role="dialog" aria-labelledby="tutorial-title">
        <div class="card-head">
            <h1 id="tutorial-title">HOW TO PLAY</h1>
            <span>{step.card + 1}/{TUTORIAL_CARDS}</span>
        </div>

        {#if step.card === 0}
            <p class="text">DOES THE <em>WORD</em><br />MATCH ITS <em>COLOR</em>?</p>
            <div class="example" style:color={COLOR_CSS.red}>RED</div>
            <p class="hint"><span class="yes">YES</span> → TAP LEFT · TRUE<br />OR PRESS ←</p>
        {:else if step.card === 1}
            <p class="text">IF THEY<br /><em>DON'T MATCH</em>...</p>
            <div class="example" style:color={COLOR_CSS.green}>BLUE</div>
            <p class="hint"><span class="no">NO</span> → TAP RIGHT · FALSE<br />OR PRESS →</p>
        {:else}
            <p class="text">BEAT THE <em>TIMER</em></p>
            <div class="timer" aria-hidden="true">
                {#each TIMER_SEGMENTS as i (i)}
                    <span class:lit={i < TIMER_LIT}></span>
                {/each}
            </div>
            <p class="hint">IT GETS FASTER EVERY LEVEL.<br />FROM LEVEL 5 MODIFIERS<br />MIX THINGS UP.</p>
        {/if}

        <div class="card-foot">
            <div class="dots" aria-hidden="true">
                {#each CARD_DOTS as i (i)}
                    <span class:on={i === step.card}></span>
                {/each}
            </div>
            <button class="next" onclick={onnext} {@attach (node) => node.focus()}>TRY IT ►</button>
        </div>
    </div>
    <button class="skip" onclick={onskip}>SKIP</button>
{:else if step?.kind === "try" && practice && challenge && expected}
    <ChallengeScreen {challenge} elapsed={0} {width} {height} />
    <div class="half" class:right={expected === "false"} aria-hidden="true"></div>
    <div class="divider" aria-hidden="true"></div>
    <div class="practice-top">TRY IT · {step.practice + 1}/{PRACTICE_WORDS.length}</div>
    <!-- Hidden while +1 or MISS! is shown, which sits at the same height -->
    <p class="explain" class:hidden={tutorial.result !== null}>
        WORD: {@render colorName(practice.word)} · COLOR: {@render colorName(practice.color)}<br />
        {expected === "true" ? "THEY MATCH" : "THEY DON'T MATCH"}
    </p>
    <div class="nudge" class:right={expected === "false"} aria-hidden="true">{expected === "true" ? "◄" : "►"}</div>
    <TapHints {flash} highlight={expected} />
{/if}

<style>
    .dimmed {
        position: absolute;
        top: 42%;
        left: 0;
        right: 0;
        text-align: center;
        font-family: Orbitron, sans-serif;
        font-weight: 900;
        font-size: max(64px, calc(10 * var(--unit)));
        color: #ff3b4e;
        opacity: 0.35;
    }

    .shade {
        position: absolute;
        inset: 0;
        background: rgb(0 0 0 / 0.6);
    }

    .card {
        position: absolute;
        top: calc(env(safe-area-inset-top) + max(80px, 18%));
        left: 50%;
        width: min(400px, calc(100% - 56px));
        box-sizing: border-box;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        gap: 18px;
        padding: 22px;
        border: 4px solid #fff;
        background: #000;
        box-shadow: 6px 6px 0 #4d8dff;
        font-size: max(10px, calc(1.3 * var(--unit)));
    }

    .card-head {
        display: flex;
        justify-content: space-between;
        color: #bbb;
    }

    h1 {
        margin: 0;
        font-size: inherit;
        font-weight: normal;
    }

    p {
        margin: 0;
    }

    .text {
        font-size: max(12px, calc(1.6 * var(--unit)));
        line-height: 2;
    }

    em {
        font-style: normal;
        color: #ffe14d;
    }

    .example {
        text-align: center;
        font-family: Orbitron, sans-serif;
        font-weight: 900;
        font-size: max(46px, calc(6 * var(--unit)));
        line-height: 1;
    }

    .hint {
        line-height: 2;
        text-align: center;
    }

    .yes {
        color: #3dff7a;
    }

    .no {
        color: #ff3b4e;
    }

    .timer {
        display: grid;
        grid-template-columns: repeat(10, minmax(0, 1fr));
        gap: 4px;
    }

    .timer span {
        height: 14px;
        background: #262626;
    }

    .timer span.lit {
        background: #3dff7a;
    }

    .card-foot {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .dots {
        display: flex;
        gap: 6px;
    }

    .dots span {
        width: 10px;
        height: 10px;
        background: #444;
    }

    .dots span.on {
        background: #fff;
    }

    button {
        border-radius: 0;
        font-family: inherit;
        cursor: pointer;
    }

    button:focus-visible {
        outline: 3px solid #ffe14d;
        outline-offset: 4px;
    }

    .next {
        height: 44px;
        padding: 0 16px;
        border: 3px solid #fff;
        background: #fff;
        color: #000;
        font-size: 10px;
    }

    .skip {
        position: absolute;
        left: 50%;
        bottom: calc(env(safe-area-inset-bottom) + 40px);
        transform: translateX(-50%);
        padding: 10px;
        border: none;
        background: none;
        color: #bbb;
        font-size: 9px;
    }

    .half {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        width: 50%;
        background: rgb(255 255 255 / 0.06);
        pointer-events: none;
    }

    .half.right {
        left: 50%;
    }

    .divider {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 50%;
        border-left: 3px dashed #333;
        pointer-events: none;
    }

    .practice-top {
        position: absolute;
        top: calc(env(safe-area-inset-top) + max(40px, calc(5 * var(--unit))));
        left: 0;
        right: 0;
        text-align: center;
        font-size: max(10px, calc(1.4 * var(--unit)));
        color: #ffe14d;
    }

    .explain {
        position: absolute;
        top: 66%;
        left: 24px;
        right: 24px;
        text-align: center;
        font-size: max(10px, calc(1.4 * var(--unit)));
        line-height: 2.1;
        color: #ddd;
    }

    .explain.hidden {
        visibility: hidden;
    }

    .nudge {
        position: absolute;
        top: 77%;
        left: 15%;
        font-size: max(26px, calc(3 * var(--unit)));
        color: #ffe14d;
        animation: nudge 0.8s ease-in-out infinite;
    }

    .nudge.right {
        left: auto;
        right: 15%;
    }

    /* Phones in landscape: the card and SKIP have to fit, the blinking hint alone shows the side */
    @media (max-height: 520px) {
        .card {
            top: calc(env(safe-area-inset-top) + 12px);
            gap: 10px;
            padding: 14px 18px;
        }

        .text,
        .hint {
            line-height: 1.8;
        }

        .skip {
            bottom: calc(env(safe-area-inset-bottom) + 8px);
        }

        .nudge {
            display: none;
        }
    }

    @keyframes nudge {
        50% {
            transform: translateX(10px);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .nudge {
            animation: none;
        }
    }
</style>
