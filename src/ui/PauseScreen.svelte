<div class="pause">
    <h1 class="title">PAUSED</h1>
    <div class="hint blink">TAP TO CONTINUE</div>
</div>

<style>
    .pause {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: max(32px, calc(5 * var(--unit)));
    }

    .title {
        margin: 0;
        font-size: max(28px, calc(6 * var(--unit)));
        font-weight: normal;
    }

    .hint {
        font-size: max(12px, calc(2.2 * var(--unit)));
        color: #ffe14d;
    }
</style>
