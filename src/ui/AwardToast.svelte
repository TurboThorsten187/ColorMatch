<script lang="ts">
    import type { Award } from "../game/awards.ts";
    import AwardBadge from "./AwardBadge.svelte";

    interface Props {
        award: Award;
    }

    let { award }: Props = $props();
</script>

<!-- Shown below the timer while the game goes on, so it must never take input -->
<div class="toast" role="status">
    <div class="badge"><AwardBadge {award} /></div>
    <div class="text">
        <small>AWARD UNLOCKED</small>
        <span>{award.name}</span>
    </div>
</div>

<style>
    .toast {
        position: absolute;
        top: calc(env(safe-area-inset-top) + max(56px, calc(6 * var(--unit))));
        left: 50%;
        width: min(420px, calc(100% - 48px));
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px;
        background: #000;
        border: 3px solid var(--yellow);
        box-shadow: 4px 4px 0 color-mix(in srgb, var(--yellow) 42%, #000);
        font-size: max(11px, calc(1.5 * var(--unit)));
        pointer-events: none;
        transform: translateX(-50%);
        animation: pop 120ms steps(3);
    }

    .badge {
        width: 44px;
        flex: none;
        font-size: 11px;
    }

    .text {
        display: grid;
        gap: 6px;
    }

    small {
        font-size: 10px;
        color: var(--yellow);
    }

    @keyframes pop {
        from {
            opacity: 0;
            transform: translate(-50%, -12px);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .toast {
            animation: none;
        }
    }
</style>
