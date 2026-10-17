<script lang="ts">
    interface Props {
        score: number;
        highscore: number;
        newRecord: boolean;
        // Buttons stay disabled for a moment so frantic taps cannot skip the result
        locked: boolean;
        onretry: () => void;
        onmenu: () => void;
    }

    let { score, highscore, newRecord, locked, onretry, onmenu }: Props = $props();
</script>

<div class="over">
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

    <div class="actions">
        <div class="continue">CONTINUE?</div>
        <button class="retry" disabled={locked} onclick={onretry}>RETRY</button>
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
        justify-content: center;
        gap: max(28px, calc(4 * var(--unit)));
        padding: env(safe-area-inset-top) 0 env(safe-area-inset-bottom);
    }

    .title {
        margin: 0;
        text-align: center;
        font-size: max(28px, calc(6 * var(--unit)));
        font-weight: normal;
        line-height: 1.4;
        color: #ff3b4e;
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
        color: #ff3b4e;
    }

    .record {
        min-height: 1em;
        font-size: max(12px, calc(2 * var(--unit)));
        color: #ffe14d;
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

    button:focus-visible {
        outline: 3px solid #ffe14d;
        outline-offset: 4px;
    }

    .retry {
        background: #fff;
        color: #000;
        box-shadow: 4px 4px 0 #3dff7a;
    }

    .menu {
        background: #000;
        color: #fff;
    }
</style>
