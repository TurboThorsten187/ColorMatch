<script lang="ts">
    import { COLOR_CSS, COLORS } from "../game/colors.ts";
    import type { ModifierIntro } from "../game/intros.ts";

    interface Props {
        intro: ModifierIntro;
        level: number;
        ongotit: () => void;
    }

    let { intro, level, ongotit }: Props = $props();

    const TIMER_SEGMENTS = Array.from({ length: 10 }, (_, i) => i);

    // What each color looks like with Inverted Colors (CSS invert)
    function inverted(css: string): string {
        const value = Number.parseInt(css.slice(1), 16);
        return `#${(0xffffff - value).toString(16).padStart(6, "0")}`;
    }

    // "ANSWER THE *OPPOSITE*" → plain and highlighted parts
    function parts(line: string): { text: string; marked: boolean }[] {
        return line.split("*").map((text, index) => ({ text, marked: index % 2 === 1 }));
    }
</script>

<div class="intro">
    <div class="top">
        <span>LV {level}</span>
        <span class="paused">PAUSED</span>
    </div>
    <div class="timer" aria-hidden="true">
        {#each TIMER_SEGMENTS as i (i)}
            <span></span>
        {/each}
    </div>

    <div class="headline blink">NEW MODIFIER!</div>

    <div class="card" role="dialog" aria-labelledby="intro-title">
        <h1 id="intro-title">{intro.title}</h1>

        <div class="example" aria-hidden="true">
            {#if intro.id === "noClick"}
                <span class="tag">{intro.example.text}</span>
            {:else}
                <span
                    class="word"
                    class:mirror={intro.id === "mirror"}
                    class:blur={intro.id === "blur"}
                    class:rotate={intro.id === "rotation"}
                    class:invert={intro.id === "invertColors"}
                    class:vanish={intro.id === "blink"}
                    class:lure={intro.id === "background"}
                    style:color={COLOR_CSS[intro.example.color]}>{intro.example.text}</span
                >
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

        {#if intro.id === "invertColors"}
            <ul class="swatches">
                {#each COLORS as color (color)}
                    <li>
                        <i style:background={inverted(COLOR_CSS[color])}></i>
                        <span style:color={COLOR_CSS[color]}>{color.toUpperCase()}</span>
                    </li>
                {/each}
            </ul>
        {/if}
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
        font-size: max(10px, calc(1.3 * var(--unit)));
    }

    .top {
        width: 100%;
        display: flex;
        justify-content: space-between;
        font-size: max(11px, calc(1.6 * var(--unit)));
    }

    .paused {
        color: #ffe14d;
    }

    .timer {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(10, minmax(0, 1fr));
        gap: 4px;
        opacity: 0.4;
    }

    .timer span {
        height: max(14px, calc(1.6 * var(--unit)));
        background: #3dff7a;
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

    .mirror {
        transform: scaleX(-1);
    }

    .blur {
        filter: blur(4px);
    }

    .rotate {
        transform: rotate(-24deg);
    }

    .invert {
        filter: invert(1);
    }

    .vanish {
        animation: blink 1s steps(1) infinite;
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

    .swatches {
        margin: 0;
        padding: 0;
        list-style: none;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px 10px;
        font-size: 8px;
    }

    li {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    i {
        width: 14px;
        height: 14px;
        flex: none;
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

    .gotit:focus-visible {
        outline: 3px solid #ffe14d;
        outline-offset: 6px;
    }

    /* Phones in landscape: the card and GOT IT have to fit without scrolling, the dim timer is left out */
    @media (max-height: 520px) {
        .intro {
            gap: 8px;
            padding-top: calc(env(safe-area-inset-top) + 10px);
            padding-bottom: calc(env(safe-area-inset-bottom) + 12px);
        }

        .timer {
            display: none;
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

    @keyframes blink {
        50% {
            opacity: 0;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .vanish {
            animation: none;
        }
    }
</style>
