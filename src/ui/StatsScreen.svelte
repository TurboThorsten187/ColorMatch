<script lang="ts">
    import { awardById, type AwardId, AWARDS } from "../game/awards.ts";
    import { averageLevel, averageReactionMs, awardProgress, formatPlayTime, type Stats } from "../game/stats.ts";
    import AwardBadge from "./AwardBadge.svelte";

    interface Props {
        stats: Stats;
        highscore: number;
        onback: () => void;
    }

    let { stats, highscore, onback }: Props = $props();

    let selectedId = $state<AwardId>(AWARDS[0].id);

    const selected = $derived(awardById(selectedId));
    const unlocked = $derived(new Set(stats.awards));
    const reaction = $derived(averageReactionMs(stats));
    const rows = $derived([
        { label: "GAMES", value: String(stats.games), hi: false },
        { label: "HI-SCORE", value: String(highscore), hi: true },
        { label: "AVG LEVEL", value: String(averageLevel(stats) ?? "-"), hi: false },
        { label: "AVG REACTION", value: reaction === null ? "-" : `${reaction} MS`, hi: false },
        { label: "PLAY TIME", value: formatPlayTime(stats.playMs), hi: false },
    ]);
    const progress = $derived(awardProgress(selected, stats, highscore));
</script>

<div class="stats">
    <div class="head">
        <!-- Focus moves here so keyboard players do not start over at the top of the page -->
        <button class="back" aria-label="Back" onclick={onback} {@attach (node) => node.focus()}>◄</button>
        <h1 class="title">STATS</h1>
    </div>

    <dl class="numbers">
        {#each rows as row (row.label)}
            <div class="row">
                <dt class:hi={row.hi}>{row.label}</dt>
                <dd>{row.value}</dd>
            </div>
        {/each}
    </dl>

    <div class="awards-head">
        <h2>AWARDS</h2>
        <span>{unlocked.size}/{AWARDS.length}</span>
    </div>

    <div class="badges">
        {#each AWARDS as award (award.id)}
            <button
                class="badge-button"
                class:selected={award.id === selectedId}
                aria-pressed={award.id === selectedId}
                aria-label="{award.name}{unlocked.has(award.id) ? '' : ', locked'}"
                onclick={() => (selectedId = award.id)}
                onfocus={() => (selectedId = award.id)}
            >
                <AwardBadge {award} locked={!unlocked.has(award.id)} />
            </button>
        {/each}
    </div>

    <div class="detail" aria-live="polite">
        <div>{selected.code} · {selected.name}</div>
        <div>{selected.rule}</div>
        {#if unlocked.has(selected.id)}
            <div class="done">UNLOCKED</div>
        {:else}
            <div class="progress">{progress.have}/{progress.need}</div>
        {/if}
    </div>
</div>

<style>
    .stats {
        position: absolute;
        inset: 0;
        width: min(100%, 460px);
        margin: 0 auto;
        box-sizing: border-box;
        overflow-y: auto;
        /* The stage blocks touch gestures, this screen may scroll on short screens */
        touch-action: pan-y;
        scrollbar-width: thin;
        scrollbar-color: #555 #000;
        padding: calc(env(safe-area-inset-top) + max(32px, calc(4 * var(--unit)))) 24px
            calc(env(safe-area-inset-bottom) + 32px);
        font-size: max(11px, calc(1.3 * var(--unit)));
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

    .back {
        width: 44px;
        height: 44px;
        flex: none;
        border: 3px solid #fff;
        border-radius: 0;
        background: #000;
        color: #fff;
        font-family: inherit;
        font-size: 12px;
        cursor: pointer;
    }

    .numbers {
        margin: 28px 0 0;
        line-height: 2.2;
    }

    .row {
        display: flex;
        justify-content: space-between;
    }

    dt {
        color: #bbb;
    }

    dt.hi {
        color: var(--red);
    }

    dd {
        margin: 0;
    }

    .awards-head {
        margin-top: 26px;
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        font-size: max(12px, calc(1.7 * var(--unit)));
        color: #bbb;
    }

    h2 {
        margin: 0;
        font-size: inherit;
        font-weight: normal;
        color: var(--yellow);
    }

    .badges {
        margin-top: 16px;
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 60px));
        justify-content: space-between;
        row-gap: 10px;
        font-size: 12px;
    }

    .badge-button {
        padding: 0;
        border: none;
        border-radius: 0;
        background: none;
        font: inherit;
        cursor: pointer;
    }

    .badge-button.selected {
        outline: 2px solid #fff;
        outline-offset: 3px;
    }

    /* On the yellow of the keyboard selection the badge turns black */
    :global(.keys) .badge-button:focus :global(.badge) {
        border-color: #000;
        color: #000;
    }

    .detail {
        margin-top: 16px;
        font-size: 10px;
        line-height: 1.8;
        color: #bbb;
    }

    .progress {
        color: var(--yellow);
    }

    .done {
        color: var(--green);
    }
</style>
