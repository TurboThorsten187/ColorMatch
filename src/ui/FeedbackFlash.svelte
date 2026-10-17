<script module lang="ts">
    export type FeedbackKind = "hit" | "miss" | "timeout";
</script>

<script lang="ts">
    interface Props {
        kind: FeedbackKind;
    }

    let { kind }: Props = $props();

    const LABELS: Readonly<Record<FeedbackKind, string>> = { hit: "+1", miss: "MISS!", timeout: "TIME UP!" };
</script>

<div class="frame" class:hit={kind === "hit"} aria-hidden="true"></div>
<div class="label" class:hit={kind === "hit"} aria-hidden="true">{LABELS[kind]}</div>

<style>
    .frame {
        position: absolute;
        inset: 0;
        border: 10px solid #ff3b4e;
        pointer-events: none;
        animation: fade 400ms ease-out forwards;
    }

    .frame.hit {
        border-color: #3dff7a;
    }

    .label {
        position: absolute;
        left: 50%;
        top: 68%;
        transform: translate(-50%, -50%);
        font-size: max(22px, calc(4 * var(--unit)));
        color: #ff3b4e;
        white-space: nowrap;
        pointer-events: none;
        animation: pop 300ms ease-out forwards;
    }

    .label.hit {
        top: 30%;
        font-size: max(18px, calc(3 * var(--unit)));
        color: #3dff7a;
        animation: rise 500ms ease-out forwards;
    }

    @keyframes fade {
        to {
            opacity: 0;
        }
    }

    @keyframes pop {
        0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.6);
        }
        50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.15);
        }
        100% {
            transform: translate(-50%, -50%) scale(1);
        }
    }

    @keyframes rise {
        to {
            opacity: 0;
            transform: translate(-50%, -150%);
        }
    }
</style>
