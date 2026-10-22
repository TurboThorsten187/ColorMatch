<script lang="ts">
    import type { Answer, Challenge } from "@/core/challenge.ts";
    import { type Color, COLOR_CSS, wordFor } from "@/core/colors.ts";
    import { type Side, sideOf } from "@/core/settings.ts";
    import {
        currentStep,
        expectedAnswer,
        PRACTICE_WORDS,
        TUTORIAL_CARDS,
        type TutorialState,
    } from "@/core/tutorial.ts";
    import TapHints from "@/ui/hud/TapHints.svelte";
    import Button from "@/ui/kit/Button.svelte";
    import Card from "@/ui/kit/Card.svelte";
    import ChallengeScreen from "@/ui/word/ChallengeScreen.svelte";
    import { inkStyle } from "@/ui/word/shapes.ts";

    interface Props {
        tutorial: TutorialState;
        // The answer that was just given, lights up its label
        flash: Answer | null;
        width: number;
        height: number;
        // Shapes instead of colors
        colorblind: boolean;
        // FALSE on the left, TRUE on the right
        flipControls: boolean;
        onnext: () => void;
        onskip: () => void;
    }

    let { tutorial, flash, width, height, colorblind, flipControls, onnext, onskip }: Props = $props();

    const KEY_ARROWS: Readonly<Record<Side, string>> = { left: "←", right: "→" };

    const CARD_DOTS = Array.from({ length: TUTORIAL_CARDS }, (_, i) => i);
    const TIMER_SEGMENTS = Array.from({ length: 10 }, (_, i) => i);
    const TIMER_LIT = 6;

    const step = $derived(currentStep(tutorial));
    const practice = $derived(step?.kind === "try" ? PRACTICE_WORDS[step.practice] : null);
    const expected = $derived(practice ? expectedAnswer(practice) : null);
    const expectedSide = $derived(expected ? sideOf(expected, flipControls) : null);
    const trueSide = $derived(sideOf("true", flipControls));
    const falseSide = $derived(sideOf("false", flipControls));
    const challenge = $derived<Challenge | null>(
        practice && expected
            ? {
                  word: practice.word,
                  color: practice.color,
                  modifiers: new Set(),
                  expected,
                  background: null,
                  rotationDeg: 0,
                  seed: 0,
                  tempo: {},
                  strength: {},
                  second: null,
                  size: 1,
              }
            : null,
    );
</script>

{#snippet colorName(color: Color)}
    <span style:color={COLOR_CSS[color]}>{wordFor(color, colorblind)}</span>
{/snippet}

{#if step?.kind === "card"}
    <div class="dimmed" aria-hidden="true">{wordFor("red", colorblind)}</div>
    <div class="shade"></div>
    <div class="card">
        <Card labelledby="tutorial-title" shadow>
            <div class="card-head">
                <h1 id="tutorial-title">HOW TO PLAY</h1>
                <span>{step.card + 1}/{TUTORIAL_CARDS}</span>
            </div>

            {#if step.card === 0}
                <p class="text">DOES THE <em>WORD</em><br />MATCH ITS <em>{colorblind ? "SHAPES" : "COLOR"}</em>?</p>
                <div class="example" style={inkStyle("red", colorblind)}>{wordFor("red", colorblind)}</div>
                <p class="hint">
                    <span class="yes">YES</span> → TAP {trueSide.toUpperCase()} · TRUE<br />OR PRESS {KEY_ARROWS[
                        trueSide
                    ]}
                </p>
            {:else if step.card === 1}
                <p class="text">IF THEY<br /><em>DON'T MATCH</em>...</p>
                <div class="example" style={inkStyle("green", colorblind)}>{wordFor("blue", colorblind)}</div>
                <p class="hint">
                    <span class="no">NO</span> → TAP {falseSide.toUpperCase()} · FALSE<br />OR PRESS {KEY_ARROWS[
                        falseSide
                    ]}
                </p>
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
                <Button onclick={onnext} {@attach (node) => node.focus()}>TRY IT ►</Button>
            </div>
        </Card>
    </div>
    <div class="skip">
        <Button onclick={onskip}>SKIP</Button>
    </div>
{:else if step?.kind === "try" && practice && challenge && expected}
    <ChallengeScreen {challenge} elapsed={0} timeLimit={Infinity} {width} {height} {colorblind} />
    <div class="half" class:right={expectedSide === "right"} aria-hidden="true"></div>
    <div class="divider" aria-hidden="true"></div>
    <div class="practice-top">TRY IT · {step.practice + 1}/{PRACTICE_WORDS.length}</div>
    <!-- Hidden while +1 or MISS! is shown, which sits at the same height -->
    <p class="explain" class:hidden={tutorial.result !== null}>
        WORD: {@render colorName(practice.word)} · {colorblind ? "SHAPE" : "COLOR"}: {@render colorName(
            practice.color,
        )}<br />
        {expected === "true" ? "THEY MATCH" : "THEY DON'T MATCH"}
    </p>
    <div class="nudge" class:right={expectedSide === "right"} aria-hidden="true">
        {expectedSide === "left" ? "◄" : "►"}
    </div>
    <TapHints {flash} highlight={expected} {flipControls} />
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
        color: var(--red);
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
        transform: translateX(-50%);
        font-size: max(11px, calc(1.3 * var(--unit)));
    }

    .card-head {
        display: flex;
        justify-content: space-between;
        color: var(--text-dim);
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
        color: var(--yellow);
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
        color: var(--green);
    }

    .no {
        color: var(--red);
    }

    .timer {
        display: grid;
        grid-template-columns: repeat(10, minmax(0, 1fr));
        gap: 4px;
    }

    .timer span {
        height: 14px;
        background: var(--fill-off);
    }

    .timer span.lit {
        background: var(--green);
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
        background: var(--line-locked);
    }

    .dots span.on {
        background: #fff;
    }

    .skip {
        position: absolute;
        left: 50%;
        bottom: calc(env(safe-area-inset-bottom) + var(--key-help-room));
        transform: translateX(-50%);
        display: flex;
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
        border-left: var(--line) dashed var(--line-faint);
        pointer-events: none;
    }

    .practice-top {
        position: absolute;
        top: calc(env(safe-area-inset-top) + max(40px, calc(5 * var(--unit))));
        left: 0;
        right: 0;
        text-align: center;
        font-size: max(11px, calc(1.4 * var(--unit)));
        color: var(--yellow);
    }

    .explain {
        position: absolute;
        top: 66%;
        left: 24px;
        right: 24px;
        text-align: center;
        font-size: max(11px, calc(1.4 * var(--unit)));
        line-height: 2.1;
        color: var(--text-soft);
    }

    .explain.hidden {
        visibility: hidden;
    }

    .nudge {
        position: absolute;
        top: 77%;
        left: 15%;
        font-size: max(26px, calc(3 * var(--unit)));
        color: var(--yellow);
        animation: nudge 0.8s ease-in-out infinite;
    }

    .nudge.right {
        left: auto;
        right: 15%;
    }

    /* Phones in landscape: the card and SKIP have to fit, the blinking hint alone shows the side */
    @media (max-height: 520px) {
        .card {
            --card-gap: 10px;
            --card-padding: 14px 18px;
            top: calc(env(safe-area-inset-top) + 12px);
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
