<script lang="ts">
    import { COLOR_CSS } from "../game/colors.ts";
    import { SPAM_WORD } from "../game/game.ts";
    import type { IntroId, ModifierIntro } from "../game/intros.ts";
    import { groupById, type ModifierId } from "../game/modifiers.ts";
    import { fadeOpacity, scramble, spin, wordMotion } from "./effects.ts";
    import TopBar from "./TopBar.svelte";

    interface Props {
        intro: ModifierIntro;
        level: number;
        // Time since the card appeared in ms, drives the animated examples
        elapsed: number;
        ongotit: () => void;
    }

    let { intro, level, elapsed, ongotit }: Props = $props();

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

    let boxWidth = $state(0);
    let boxHeight = $state(0);
    let wordWidth = $state(0);
    let wordHeight = $state(0);

    const effects = $derived<ReadonlySet<ModifierId>>(
        new Set(ANIMATED.has(intro.id) ? groupById(intro.id).variants : []),
    );
    const exampleText = $derived(
        effects.has("scrambled") ? scramble(intro.example.text, EXAMPLE_SEED, elapsed) : intro.example.text,
    );
    const transform = $derived.by(() => {
        const area = { width: boxWidth, height: boxHeight };
        const { x, y, scale, rotation } = wordMotion(effects, EXAMPLE_SEED, elapsed, area, {
            width: wordWidth,
            height: wordHeight,
        });
        const turned = rotation + (intro.id === "rotation" ? ROTATION_START_DEG + spin(EXAMPLE_SEED, elapsed) : 0);
        const [mirrorX, mirrorY] =
            intro.id === "mirror" ? MIRRORS[Math.floor(elapsed / MIRROR_STEP_MS) % MIRRORS.length] : [1, 1];
        return `translate(${x}px, ${y}px) rotate(${turned}deg) scale(${mirrorX * scale}, ${mirrorY * scale})`;
    });
    const opacity = $derived(intro.id === "blink" ? fadeOpacity(elapsed % FADE_LOOP_MS) : 1);
    // All characters lit stays for two steps before it starts over
    const spamLit = $derived(Math.floor(elapsed / SPAM_STEP_MS) % (SPAM_WORD.length + 2));

    // "ANSWER THE *OPPOSITE*" → plain and highlighted parts
    function parts(line: string): { text: string; marked: boolean }[] {
        return line.split("*").map((text, index) => ({ text, marked: index % 2 === 1 }));
    }
</script>

<div class="intro">
    <!-- The level waits with its full time -->
    <TopBar {level} remaining={1} paused inline />

    <div class="headline blink">NEW MODIFIER!</div>

    <div class="card" role="dialog" aria-labelledby="intro-title">
        <h1 id="intro-title">{intro.title}</h1>

        <div class="example" aria-hidden="true" bind:clientWidth={boxWidth} bind:clientHeight={boxHeight}>
            {#if intro.id === "noClick"}
                <span class="tag">{intro.example.text}</span>
            {:else}
                <span
                    class="word"
                    class:blur={intro.id === "blur"}
                    class:lure={intro.id === "background"}
                    style:color={COLOR_CSS[intro.example.color]}
                    style:transform
                    style:opacity={opacity < 1 ? opacity : null}
                    bind:clientWidth={wordWidth}
                    bind:clientHeight={wordHeight}
                >
                    {#if intro.id === "spam"}
                        {#each [...exampleText] as character, index (index)}
                            <span style:color={index < spamLit ? null : SPAM_DIM}>{character}</span>
                        {/each}
                    {:else}
                        {exampleText}
                    {/if}
                </span>
            {/if}
        </div>

        <p class="lines">
            {#each intro.lines as line, row (row)}
                {#each parts(line) as part, index (index)}
                    {#if part.marked}
                        <span style:color={COLOR_CSS[intro.accent]}>{part.text}</span>
                    {:else}
                        {part.text}
                    {/if}
                {/each}
                {#if row < intro.lines.length - 1}<br />{/if}
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
        padding: calc(env(safe-area-inset-top) + 16px) 24px calc(env(safe-area-inset-bottom) + 32px);
        overflow-y: auto;
        touch-action: pan-y;
        scrollbar-width: thin;
        scrollbar-color: #555 #000;
        font-size: max(11px, calc(1.3 * var(--unit)));
    }

    .headline {
        margin-top: auto;
        font-size: max(18px, calc(2.4 * var(--unit)));
        color: #ffe14d;
    }

    .card {
        width: min(400px, 100%);
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 18px;
        padding: 22px;
        border: 4px double #ffe14d;
        background: #000;
    }

    h1 {
        margin: 0;
        text-align: center;
        font-size: max(13px, calc(1.7 * var(--unit)));
        font-weight: normal;
    }

    .example {
        height: max(80px, calc(10 * var(--unit)));
        display: grid;
        place-items: center;
        overflow: hidden;
    }

    .word {
        display: inline-block;
        font-family: Orbitron, sans-serif;
        font-weight: 900;
        font-size: max(40px, calc(5 * var(--unit)));
        line-height: 1;
    }

    .tag {
        padding: 8px 10px;
        background: #fff;
        color: #000;
    }

    .blur {
        filter: blur(4px);
    }

    .lure {
        padding: 10px 16px;
        background: #ff3b4e;
    }

    .lines {
        margin: 0;
        text-align: center;
        line-height: 2.1;
    }

    .gotit {
        margin-top: auto;
        width: min(400px, 100%);
        height: 56px;
        flex: none;
        border: 4px solid #fff;
        border-radius: 0;
        background: #fff;
        color: #000;
        font-family: inherit;
        font-size: 13px;
        box-shadow: 4px 4px 0 #ffe14d;
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

        .lines {
            line-height: 1.8;
        }

        .gotit {
            height: 44px;
        }
    }
</style>
