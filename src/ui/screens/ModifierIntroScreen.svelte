<script lang="ts">
    import { COLOR_CSS } from "@/core/colors.ts";
    import { introExample, type ModifierIntro } from "@/core/intros.ts";
    import { isNegative } from "@/modifiers/negative/look.ts";
    import TopBar from "@/ui/hud/TopBar.svelte";
    import Button from "@/ui/kit/Button.svelte";
    import Card from "@/ui/kit/Card.svelte";
    import Screen from "@/ui/kit/Screen.svelte";
    import RuleSign from "@/ui/word/RuleSign.svelte";
    import { CARD } from "@/ui/word/wordFrame.ts";
    import WordView from "@/ui/word/WordView.svelte";

    interface Props {
        intro: ModifierIntro;
        level: number;
        // Time since the card appeared in ms, plays the example
        elapsed: number;
        // Shapes instead of colors
        colorblind: boolean;
        // FALSE on the left, TRUE on the right
        flipControls: boolean;
        ongotit: () => void;
    }

    let { intro, level, elapsed, colorblind, flipControls, ongotit }: Props = $props();

    let boxWidth = $state(0);
    let boxHeight = $state(0);

    // Drawn like a level of the group, as its demo says (src/core/intros.ts)
    const example = $derived(introExample(intro.id, elapsed));
    const playing = $derived(example.kind === "word" ? example : null);
    // The example box turns into its photo negative like a level does
    const negative = $derived(
        playing !== null &&
            playing.challenge.modifiers.has("negative") &&
            isNegative(playing.elapsed, playing.timeLimit),
    );
    // The level waits with its full time; only the COUNT UP card fills the timer to show how it runs
    const remaining = $derived(
        playing?.challenge.modifiers.has("countUp") ? 1 - playing.elapsed / playing.timeLimit : 1,
    );
    const lines = $derived(
        colorblind && intro.colorblindLines
            ? intro.colorblindLines
            : flipControls && intro.flippedLines
              ? intro.flippedLines
              : intro.lines,
    );

    // "ANSWER THE *OPPOSITE*" → plain and highlighted parts
    function parts(line: string): { text: string; marked: boolean }[] {
        return line.split("*").map((text, index) => ({ text, marked: index % 2 === 1 }));
    }
</script>

<Screen scroll>
    <div class="intro">
        <TopBar {level} {remaining} countUp={intro.id === "countUp"} paused inline />

        <div class="headline blink">NEW MODIFIER!</div>

        <div class="card">
            <Card labelledby="intro-title" double>
                <h1 id="intro-title">{intro.title}</h1>

                <div
                    class="example"
                    style:filter={negative ? "invert(1)" : null}
                    aria-hidden="true"
                    bind:clientWidth={boxWidth}
                    bind:clientHeight={boxHeight}
                >
                    {#if example.kind === "sign"}
                        <RuleSign icon={example.sign.icon} text={example.sign.text} />
                    {:else if boxWidth > 0}
                        <WordView
                            challenge={example.challenge}
                            elapsed={example.elapsed}
                            timeLimit={example.timeLimit}
                            spamCount={example.spamCount}
                            width={boxWidth}
                            height={boxHeight}
                            layout={CARD}
                            {colorblind}
                        />
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
            </Card>
        </div>

        <div class="gotit">
            <Button size="large" onclick={ongotit} {@attach (node) => node.focus()}>GOT IT</Button>
        </div>
    </div>
</Screen>

<style>
    .intro {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: max(18px, calc(2.4 * var(--unit)));
        padding: 16px 24px 0;
        font-size: max(11px, calc(1.3 * var(--unit)));
    }

    .headline {
        margin-top: auto;
        font-size: max(18px, calc(2.4 * var(--unit)));
        color: var(--accent);
    }

    .card {
        width: min(400px, 100%);
    }

    h1 {
        margin: 0;
        text-align: center;
        font-size: max(13px, calc(1.7 * var(--unit)));
        font-weight: normal;
    }

    /* Black, so the negative turns all of it white; the example is drawn into it like a level onto the stage */
    .example {
        position: relative;
        height: max(80px, calc(10 * var(--unit)));
        display: grid;
        place-items: center;
        overflow: hidden;
        background: #000;
    }

    .lines {
        margin: 0;
        text-align: center;
        line-height: 2.1;
    }

    .gotit {
        --button-width: 100%;
        margin-top: auto;
        width: min(400px, 100%);
        flex: none;
        display: flex;
    }

    /* Phones in landscape: the card and GOT IT have to fit without scrolling */
    @media (max-height: 520px) {
        .intro {
            gap: 8px;
            padding-top: 10px;
            padding-bottom: 12px;
        }

        .card {
            --card-gap: 10px;
            --card-padding: 12px 18px;
        }

        .example {
            height: 56px;
        }

        .lines {
            line-height: 1.8;
        }

        .gotit {
            --button-height: 44px;
        }
    }
</style>
