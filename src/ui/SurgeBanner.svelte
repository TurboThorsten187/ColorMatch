<div class="banner">
    <div class="hazard"></div>
    <div class="word">SURGE</div>
    <div class="hazard"></div>
</div>

<style>
    .banner {
        --stripe: max(10px, calc(3 * var(--unit)));
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: max(16px, calc(4 * var(--unit)));
        overflow: hidden;
    }

    .hazard {
        width: 100%;
        height: max(16px, calc(5 * var(--unit)));
        background: repeating-linear-gradient(
            -45deg,
            #ffe14d 0 var(--stripe),
            #000 var(--stripe) calc(2 * var(--stripe))
        );
        animation: slide 500ms linear infinite;
    }

    /* 5 characters of a monospace pixel font: sized so the word always fits the width */
    .word {
        font-size: min(13vw, 14dvh);
        color: #ffe14d;
        text-shadow: 0.08em 0.08em 0 #ff3b4e;
        animation: slam 180ms steps(4, end) backwards;
    }

    /* One period of the diagonal stripes along the band, so the loop has no jump */
    @keyframes slide {
        to {
            background-position: calc(2 * 1.4142 * var(--stripe)) 0;
        }
    }

    @keyframes slam {
        from {
            transform: scale(3);
            opacity: 0;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .hazard,
        .word {
            animation: none;
        }
    }
</style>
