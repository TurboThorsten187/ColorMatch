<script lang="ts">
    import { type Color, COLOR_CSS, wordFor } from "@/core/colors.ts";
    import { SPAM_WORD } from "@/core/game.ts";
    import type { IntroId, ModifierIntro } from "@/core/intros.ts";
    import { groupById, type ModifierId } from "@/core/modifiers.ts";
    import { WORD_FONT, WORD_WEIGHT } from "@/platform/fonts.ts";
    import TopBar from "@/ui/hud/TopBar.svelte";
    import {
        afterimageOpacity,
        assembleRemaining,
        assembleStart,
        fadeOpacity,
        isNegative,
        scramble,
        spin,
        wordMotion,
    } from "@/ui/word/effects.ts";
    import { textWidth } from "@/ui/word/fitText.ts";
    import { emWidth, flipLetters } from "@/ui/word/fontFlip.ts";
    import { RULE_ICONS } from "@/ui/word/ruleIcons.ts";
    import RuleSign from "@/ui/word/RuleSign.svelte";
    import { backgroundStyle, inkStyle } from "@/ui/word/shapes.ts";
    import SplitMirror from "@/ui/word/SplitMirror.svelte";

    interface Props {
        intro: ModifierIntro;
        level: number;
        // Time since the card appeared in ms, drives the animated examples
        elapsed: number;
        // Shapes instead of colors
        colorblind: boolean;
        // FALSE on the left, TRUE on the right
        flipControls: boolean;
        ongotit: () => void;
    }

    let { intro, level, elapsed, colorblind, flipControls, ongotit }: Props = $props();

    // Their examples are animated with the game's own effect functions
    const ANIMATED: ReadonlySet<IntroId> = new Set(["moving", "scrambled", "shaky", "pulsing"]);
    const EXAMPLE_SEED = 0.37;
    const ROTATION_START_DEG = -24;
    // The mirror example takes turns with all three mirrors
    const MIRRORS: readonly (readonly [number, number])[] = [
        [-1, 1],
        [1, -1],
        [-1, -1],
    ];
    const MIRROR_STEP_MS = 1000;
    // The blink example fades out, stays away for a moment and comes back
    const FADE_LOOP_MS = 1800;
    const SPAM_STEP_MS = 300;
    const SPAM_DIM = "#3a3a3a";
    // The background example shows what the word says, to fool the player
    const LURE: Color = "red";
    // Share of the example box the word may take up: long shape words like TRIANGLE shrink on narrow phones
    const FIT_SHARE = 0.95;
    const MEASURE_PX = 100;
    // Tiny, but still readable on the card
    const ZOOM_SCALE = 0.3;
    // The letters assemble within the first second of every loop, as if the time limit were four seconds
    const ASSEMBLE_LOOP_MS = 2200;
    const ASSEMBLE_LIMIT_MS = 4000;
    // The negative and the time limit it runs on loop, so do the WAIT sign and the filling timer
    const NEGATIVE_LOOP_MS = 2000;
    const WAIT_STEP_MS = 1000;
    const COUNT_UP_LOOP_MS = 3000;
    // Font Flip starts over now and then, so a card left open does not count up ever more font steps
    const FONT_FLIP_LOOP_MS = 4000;
    const ORBITRON = { family: WORD_FONT, weight: WORD_WEIGHT };

    let boxWidth = $state(0);
    let boxHeight = $state(0);
    let wordWidth = $state(0);
    let wordHeight = $state(0);

    const effects = $derived<ReadonlySet<ModifierId>>(
        new Set(ANIMATED.has(intro.id) ? groupById(intro.id).variants : []),
    );
    const baseText = $derived("word" in intro.example ? wordFor(intro.example.word, colorblind) : intro.example.text);
    const exampleText = $derived(effects.has("scrambled") ? scramble(baseText, EXAMPLE_SEED, elapsed) : baseText);
    const secondText = $derived(intro.second ? wordFor(intro.second.word, colorblind) : null);
    const lines = $derived(
        colorblind && intro.colorblindLines
            ? intro.colorblindLines
            : flipControls && intro.flippedLines
              ? intro.flippedLines
              : intro.lines,
    );
    // The largest font size at which the word (or the wider of two) still fits its box, unset until it is measured
    const fitFont = $derived(
        boxWidth > 0
            ? (boxWidth * FIT_SHARE * MEASURE_PX) /
                  Math.max(
                      ...[baseText, ...(secondText ? [secondText] : [])].map((text) =>
                          textWidth({ text, fontSize: MEASURE_PX }, WORD_FONT, WORD_WEIGHT),
                      ),
                  )
            : null,
    );
    const pieces = $derived(intro.id === "splitMirror" || intro.id === "fontFlip" || intro.id === "assemble");
    // FONT FLIP: no letter makes the word wider than it is in Orbitron
    const flipped = $derived(
        intro.id === "fontFlip"
            ? flipLetters(
                  exampleText,
                  EXAMPLE_SEED,
                  elapsed % FONT_FLIP_LOOP_MS,
                  1,
                  emWidth(exampleText, ORBITRON),
                  0,
                  colorblind,
              )
            : [],
    );
    // ASSEMBLE: the letters fly in from the edges of the example box to their place, in em from the word's middle
    const assembled = $derived.by(() => {
        if (intro.id !== "assemble") return [];
        const letters = [...exampleText];
        const widths = letters.map((char) => emWidth(char, ORBITRON));
        let left = -widths.reduce((sum, letterWidth) => sum + letterWidth, 0) / 2;
        const area = { width: boxWidth, height: boxHeight };
        return letters.map((char, index) => {
            const place = left + widths[index] / 2;
            left += widths[index];
            const start = assembleStart(EXAMPLE_SEED, index, area, wordHeight / 2);
            const remaining = assembleRemaining(EXAMPLE_SEED, index, elapsed % ASSEMBLE_LOOP_MS, ASSEMBLE_LIMIT_MS);
            const x = `calc(${start.x * remaining}px - ${place * remaining}em)`;
            return { char, transform: `translate(${x}, ${start.y * remaining}px)` };
        });
    });
    const negative = $derived(intro.id === "negative" && isNegative(elapsed % NEGATIVE_LOOP_MS, NEGATIVE_LOOP_MS));
    const afterimage = $derived(
        intro.id === "negative" ? afterimageOpacity(elapsed % NEGATIVE_LOOP_MS, NEGATIVE_LOOP_MS) : 0,
    );
    const waitShown = $derived(Math.floor(elapsed / WAIT_STEP_MS) % 2 === 0);
    // The level waits with its full time; only the COUNT UP card fills the timer to show how it runs
    const remaining = $derived(intro.id === "countUp" ? 1 - (elapsed % COUNT_UP_LOOP_MS) / COUNT_UP_LOOP_MS : 1);
    const transform = $derived.by(() => {
        const area = { width: boxWidth, height: boxHeight };
        const { x, y, scale, rotation } = wordMotion(effects, EXAMPLE_SEED, elapsed, area, {
            width: wordWidth,
            height: wordHeight,
        });
        const turned = rotation + (intro.id === "rotation" ? ROTATION_START_DEG + spin(EXAMPLE_SEED, elapsed) : 0);
        const [mirrorX, mirrorY] =
            intro.id === "mirror" ? MIRRORS[Math.floor(elapsed / MIRROR_STEP_MS) % MIRRORS.length] : [1, 1];
        const size = scale * (intro.id === "zoom" ? ZOOM_SCALE : 1);
        return `translate(${x}px, ${y}px) rotate(${turned}deg) scale(${mirrorX * size}, ${mirrorY * size})`;
    });
    const opacity = $derived(intro.id === "blink" ? fadeOpacity(elapsed % FADE_LOOP_MS) : 1);
    // All characters lit stays for two steps before it starts over
    const spamLit = $derived(Math.floor(elapsed / SPAM_STEP_MS) % (SPAM_WORD.length + 2));

    // "ANSWER THE *OPPOSITE*" → plain and highlighted parts
    function parts(line: string): { text: string; marked: boolean }[] {
        return line.split("*").map((text, index) => ({ text, marked: index % 2 === 1 }));
    }
</script>

{#snippet exampleWord()}
    <!-- SPAM! is not about the color, its characters light up in plain ink -->
    <span
        class="word"
        class:blur={intro.id === "blur"}
        style={pieces ? null : inkStyle(intro.example.color, colorblind && intro.id !== "spam")}
        style:--fit={fitFont === null ? null : `${fitFont}px`}
        style:transform
        style:opacity={opacity < 1 ? opacity : null}
        bind:clientWidth={wordWidth}
        bind:clientHeight={wordHeight}
    >
        {#if intro.id === "spam"}
            {#each [...exampleText] as character, index (index)}
                <span style:color={index < spamLit ? null : SPAM_DIM}>{character}</span>
            {/each}
        {:else if intro.id === "splitMirror"}
            <SplitMirror ink={intro.example.color} {colorblind}>{exampleText}</SplitMirror>
        {:else if intro.id === "fontFlip"}
            {#each flipped as letter, index (index)}
                <span
                    class="letter"
                    style={inkStyle(intro.example.color, colorblind)}
                    style:font-family={letter.font.family}
                    style:font-weight={letter.font.weight}
                    style:font-size="{letter.size}em">{letter.char}</span
                >
            {/each}
        {:else if intro.id === "assemble"}
            {#each assembled as letter, index (index)}
                <span
                    class="letter"
                    style={inkStyle(intro.example.color, colorblind)}
                    style:transform={letter.transform}>{letter.char}</span
                >
            {/each}
        {:else}
            {exampleText}
        {/if}
    </span>
{/snippet}

<div class="intro">
    <TopBar {level} {remaining} countUp={intro.id === "countUp"} paused inline />

    <div class="headline blink">NEW MODIFIER!</div>

    <div class="card" role="dialog" aria-labelledby="intro-title">
        <h1 id="intro-title">{intro.title}</h1>

        <div
            class="example"
            style:filter={negative ? "invert(1)" : null}
            aria-hidden="true"
            bind:clientWidth={boxWidth}
            bind:clientHeight={boxHeight}
        >
            {#if intro.id === "noClick" || intro.id === "doubleTap"}
                <RuleSign icon={RULE_ICONS[intro.id]} text={baseText} />
            {:else if intro.id === "wait"}
                <RuleSign icon={waitShown ? RULE_ICONS.wait : RULE_ICONS.now} text={waitShown ? "WAIT" : "NOW"} />
            {:else if intro.second && secondText}
                <span class="pair">
                    {@render exampleWord()}
                    <span class="word" style={inkStyle(intro.second.color, colorblind)}>{secondText}</span>
                </span>
            {:else if intro.id === "negative"}
                <!-- The afterimage lies behind the word in its negative colors -->
                <span class="negative">
                    {@render exampleWord()}
                    <span
                        class="word afterimage"
                        style={inkStyle(intro.example.color, colorblind)}
                        style:opacity={afterimage}>{exampleText}</span
                    >
                </span>
            {:else if intro.id === "background"}
                <!-- The lure behind the word: its color, or its shapes in the colorblind mode -->
                <span class="lure" style:background={backgroundStyle(LURE, colorblind, true)}
                    >{@render exampleWord()}</span
                >
            {:else}
                {@render exampleWord()}
            {/if}
        </div>

        <p class="lines">
            {#each lines as line, row (row)}
                {#each parts(line) as part, index (index)}
                    {#if part.marked}
                        <span style:color={COLOR_CSS[intro.accent]}>{part.text}</span>
                    {:else}
                        {part.text}
                    {/if}
                {/each}
                {#if row < lines.length - 1}<br />{/if}
            {/each}
        </p>
    </div>

    <button class="gotit" onclick={ongotit} {@attach (node) => node.focus()}>GOT IT</button>
</div>

<style>
    .intro {
        position: absolute;
        inset: 0;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: max(18px, calc(2.4 * var(--unit)));
        /* The bottom keeps room for App's keys hint */
        padding: calc(env(safe-area-inset-top) + 16px) 24px calc(env(safe-area-inset-bottom) + 40px);
        overflow-y: auto;
        touch-action: pan-y;
        scrollbar-width: thin;
        scrollbar-color: #555 #000;
        font-size: max(11px, calc(1.3 * var(--unit)));
    }

    .headline {
        margin-top: auto;
        font-size: max(18px, calc(2.4 * var(--unit)));
        color: var(--accent);
    }

    .card {
        width: min(400px, 100%);
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 18px;
        padding: 22px;
        border: 4px double var(--accent);
        background: #000;
    }

    h1 {
        margin: 0;
        text-align: center;
        font-size: max(13px, calc(1.7 * var(--unit)));
        font-weight: normal;
    }

    /* Black, so the negative turns all of it white */
    .example {
        height: max(80px, calc(10 * var(--unit)));
        display: grid;
        place-items: center;
        overflow: hidden;
        background: #000;
    }

    .word {
        position: relative;
        display: inline-block;
        font-family: Orbitron, sans-serif;
        font-weight: 900;
        font-size: min(max(40px, calc(5 * var(--unit))), var(--fit, 100vw));
        line-height: 1;
        white-space: nowrap;
    }

    .letter {
        display: inline-block;
    }

    .pair {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
    }

    /* Two lines fill the example box */
    .pair .word {
        font-size: min(max(32px, calc(3.6 * var(--unit))), var(--fit, 100vw) * 0.8);
    }

    .negative {
        position: relative;
        isolation: isolate;
    }

    .afterimage {
        position: absolute;
        left: 0;
        top: 0;
        z-index: -1;
        transform: translate(12px, 8px);
        filter: invert(1);
    }

    .blur {
        filter: blur(4px);
    }

    .lure {
        padding: 10px 16px;
    }

    .lines {
        margin: 0;
        text-align: center;
        line-height: 2.1;
    }

    .gotit {
        --button-color: var(--accent);
        margin-top: auto;
        width: min(400px, 100%);
        height: 56px;
        flex: none;
        border: 4px solid #fff;
        border-radius: 0;
        background: #000;
        color: #fff;
        font-family: inherit;
        font-size: 13px;
        cursor: pointer;
    }

    /* Phones in landscape: the card and GOT IT have to fit without scrolling */
    @media (max-height: 520px) {
        .intro {
            gap: 8px;
            padding-top: calc(env(safe-area-inset-top) + 10px);
            padding-bottom: calc(env(safe-area-inset-bottom) + 12px);
        }

        .card {
            gap: 10px;
            padding: 12px 18px;
        }

        .example {
            height: 56px;
        }

        .pair .word {
            font-size: min(24px, var(--fit, 100vw) * 0.8);
        }

        .lines {
            line-height: 1.8;
        }

        .gotit {
            height: 44px;
        }
    }
</style>
