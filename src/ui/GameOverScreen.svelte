<script lang="ts">
    import { awardById, type AwardId } from "../game/awards.ts";
    import AwardBadge from "./AwardBadge.svelte";
    import { BUTTONS_APPEAR_MS, POWER_ON_MS } from "./lossAnimation.ts";

    interface Props {
        score: number;
        highscore: number;
        newRecord: boolean;
        // Unlocked during this game
        awards: readonly AwardId[];
        // Buttons stay disabled for a moment so frantic taps cannot skip the result
        locked: boolean;
        onretry: () => void;
        onmenu: () => void;
    }

    let { score, highscore, newRecord, awards, locked, onretry, onmenu }: Props = $props();

    // More rows would push the buttons off small screens
    const MAX_LISTED = 3;

    const listed = $derived(awards.slice(0, MAX_LISTED).map(awardById));
</script>

<div class="over" style:--power-on="{POWER_ON_MS}ms" style:--buttons="{BUTTONS_APPEAR_MS}ms">
    <h1 class="title">GAME<br />OVER</h1>

    <dl class="scores">
        <div class="row">
            <dt>SCORE</dt>
            <dd>{String(score).padStart(6, "0")}</dd>
        </div>
        <div class="row">
            <dt class="hi">HI-SCORE</dt>
            <dd>{String(highscore).padStart(6, "0")}</dd>
        </div>
    </dl>

    <div class="record">
        {#if newRecord}<span class="blink">NEW HI-SCORE!</span>{/if}
    </div>

    {#if listed.length > 0}
        <div class="awards">
            <h2>NEW AWARDS</h2>
            <ul>
                {#each listed as award (award.id)}
                    <li><span class="badge"><AwardBadge {award} /></span>{award.name}</li>
                {/each}
            </ul>
            {#if awards.length > MAX_LISTED}<div class="more">+{awards.length - MAX_LISTED} MORE</div>{/if}
        </div>
    {/if}

    <div class="actions">
        <div class="continue">CONTINUE?</div>
        <button
            class="retry"
            disabled={locked}
            onclick={onretry}
            {@attach (node) => {
                // Selected as soon as it can be pressed
                if (!locked) node.focus();
            }}>RETRY</button
        >
        <button class="menu" disabled={locked} onclick={onmenu}>MENU</button>
    </div>
</div>

<style>
    .over {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        /* "safe" keeps the title reachable when the content is taller than the screen, which then scrolls */
        justify-content: safe center;
        gap: max(28px, calc(4 * var(--unit)));
        padding: env(safe-area-inset-top) 0 env(safe-area-inset-bottom);
        overflow-y: auto;
        touch-action: pan-y;
        scrollbar-width: thin;
        scrollbar-color: #555 #000;
    }

    /* Phones in landscape */
    @media (max-height: 520px) {
        .over {
            gap: 12px;
            padding-block: calc(env(safe-area-inset-top) + 12px) calc(env(safe-area-inset-bottom) + 12px);
        }

        .over .title {
            font-size: 22px;
        }
    }

    .title {
        margin: 0;
        text-align: center;
        font-size: max(28px, calc(6 * var(--unit)));
        font-weight: normal;
        line-height: 1.4;
        color: var(--red);
        animation: power-on var(--power-on) step-end both;
    }

    /* After the title, like a CRT warming up */
    .scores,
    .record,
    .awards {
        animation: appear 240ms steps(3) var(--power-on) both;
    }

    .actions {
        animation: appear 240ms steps(3) var(--buttons) both;
    }

    .scores,
    .actions {
        width: min(320px, 84%);
    }

    .scores {
        margin: 0;
        font-size: max(12px, calc(2 * var(--unit)));
        line-height: 2.2;
    }

    .row {
        display: flex;
        justify-content: space-between;
    }

    dd {
        margin: 0;
    }

    .hi {
        color: var(--red);
    }

    .record {
        min-height: 1em;
        font-size: max(12px, calc(2 * var(--unit)));
        color: var(--accent);
    }

    .awards {
        width: min(320px, 84%);
        box-sizing: border-box;
        display: grid;
        gap: 10px;
        padding: 12px;
        border: 3px solid var(--accent);
        font-size: 10px;
    }

    h2 {
        margin: 0;
        font-size: inherit;
        font-weight: normal;
        color: var(--accent);
    }

    ul {
        margin: 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 8px;
    }

    li {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .badge {
        width: 38px;
        flex: none;
        font-size: 10px;
    }

    .more {
        color: #bbb;
    }

    .actions {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .continue {
        text-align: center;
        font-size: 11px;
        color: #bbb;
    }

    button {
        height: 54px;
        border: 4px solid #fff;
        border-radius: 0;
        font-family: inherit;
        font-size: 13px;
        cursor: pointer;
    }

    button:disabled {
        opacity: 0.4;
        cursor: default;
    }

    .retry {
        background: #000;
        color: #fff;
        box-shadow: 4px 4px 0 var(--green);
    }

    .menu {
        background: #000;
        color: #fff;
    }

    /* The title switches on like the CRT that just went off: a bright line opens up and flickers */
    @keyframes power-on {
        0% {
            transform: scaleY(0.05);
            filter: brightness(3);
        }
        25% {
            transform: scaleY(0.53);
            filter: brightness(3);
            opacity: 0.7;
        }
        50% {
            transform: scaleY(1);
            filter: brightness(3);
            opacity: 0.4;
        }
        75% {
            filter: brightness(2);
            opacity: 0.7;
        }
    }

    @keyframes appear {
        from {
            opacity: 0;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .title,
        .scores,
        .record,
        .awards,
        .actions {
            animation: none;
        }
    }
</style>
