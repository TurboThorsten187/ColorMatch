<script lang="ts">
    import { awardById, type AwardId, AWARDS } from "@/core/awards.ts";
    import { averageLevel, averageReactionMs, awardProgress, formatPlayTime, type Stats } from "@/core/stats.ts";
    import AwardBadge from "@/ui/hud/AwardBadge.svelte";
    import Screen from "@/ui/kit/Screen.svelte";
    import ScreenHead from "@/ui/kit/ScreenHead.svelte";

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

<Screen scroll narrow>
    <div class="stats">
        <ScreenHead title="STATS" {onback} />

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
                <!-- Only selects, so it is no Button that gives way first -->
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
</Screen>

<style>
    .stats {
        padding: max(32px, calc(4 * var(--unit))) 24px 0;
        font-size: max(11px, calc(1.3 * var(--unit)));
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
        color: var(--text-dim);
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
        color: var(--text-dim);
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
        font-size: var(--text-medium);
    }

    /* A tile, not a framed button: the badge is its frame, the outline around it the selection */
    .badge-button {
        padding: 0;
        border: none;
        border-radius: 0;
        background: none;
        font: inherit;
        cursor: pointer;
    }

    /* On the badge, App removes the focus outline of buttons */
    .badge-button.selected :global(.badge) {
        outline: 2px solid #fff;
        outline-offset: 3px;
    }

    :global(.keys) .badge-button:focus :global(.badge) {
        outline-color: var(--select);
    }

    .detail {
        margin-top: 16px;
        font-size: var(--text-tiny);
        line-height: 1.8;
        color: var(--text-dim);
    }

    .progress {
        color: var(--yellow);
    }

    .done {
        color: var(--green);
    }
</style>
