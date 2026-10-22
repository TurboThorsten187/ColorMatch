<script lang="ts">
    import { COLOR_CSS, COLORS } from "@/core/colors.ts";
    import type { PlayingState } from "@/core/game.ts";
    import { FEEDBACK_LABELS, type FeedbackKind } from "@/ui/hud/FeedbackFlash.svelte";
    import TapHints from "@/ui/hud/TapHints.svelte";
    import TopBar from "@/ui/hud/TopBar.svelte";
    import ChallengeScreen from "@/ui/word/ChallengeScreen.svelte";
    import {
        type Block,
        blockAt,
        blockSize,
        blocksOpacity,
        lossFrame,
        SHAKE_OFFSETS,
        wordBlocks,
    } from "./lossAnimation.ts";

    interface Props {
        // The lost level, frozen at the moment it was lost
        level: PlayingState;
        lostAt: number;
        kind: Exclude<FeedbackKind, "hit">;
        // Time since the loss in ms
        elapsed: number;
        highscore: number;
        width: number;
        height: number;
        colorblind: boolean;
        flipControls: boolean;
    }

    let { level, lostAt, kind, elapsed, highscore, width, height, colorblind, flipControls }: Props = $props();

    const SHAKE_PX = 7;
    // SYMMETRY cuts at the middle only, letters of ASSEMBLE may still be far above, below or left of the word
    const CUT_REACH_PX = 10000;

    // A new shake for every loss
    const offsets: readonly (readonly [number, number])[] = Array.from({ length: SHAKE_OFFSETS }, () => [
        shakeOffset(),
        shakeOffset(),
    ]);

    let anchor = $state<HTMLElement>();
    let canvas = $state<HTMLCanvasElement>();
    // Read once from the word on screen, before it is replaced by its blocks
    let blocks: readonly Block[] | null = null;
    let blockPx = 0;

    const frozen = $derived(lostAt - level.startedAt);
    const frame = $derived(lossFrame(elapsed));
    const transform = $derived.by(() => {
        const [x, y] = (frame.shakeStep === null ? undefined : offsets[frame.shakeStep]) ?? [0, 0];
        return `translate(${x}px, ${y}px) scale(${frame.scaleX}, ${frame.scaleY})`;
    });

    $effect(() => {
        if (anchor && blocks === null) blocks = readBlocks(anchor);
    });

    $effect(() => {
        const context = canvas?.getContext("2d");
        if (!canvas || !context) return;
        const ratio = window.devicePixelRatio || 1;
        const pixelWidth = Math.round(width * ratio);
        const pixelHeight = Math.round(height * ratio);
        if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
            canvas.width = pixelWidth;
            canvas.height = pixelHeight;
        }
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.clearRect(0, 0, width, height);
        const opacity = blocksOpacity(elapsed);
        if (!blocks || opacity === 0) return;
        context.globalAlpha = opacity;
        for (const block of blocks) {
            const { x, y } = blockAt(block, elapsed, height);
            context.fillStyle = block.color;
            context.fillRect(Math.round(x), Math.round(y), blockPx, blockPx);
        }
        context.globalAlpha = 1;
    });

    // Draws the word as it is on screen (rotated, mirrored, moved) into an image and cuts it into blocks. The word is
    // the anchor's first child; it, or each of its pieces, carries its ink in data-ink.
    function readBlocks(target: HTMLElement): readonly Block[] {
        const word = target.firstElementChild;
        const image = document.createElement("canvas");
        image.width = Math.round(width);
        image.height = Math.round(height);
        const context = image.getContext("2d", { willReadFrequently: true });
        if (!(word instanceof HTMLElement) || !context) return [];

        // The anchor sits in the middle of the screen, its transform holds every effect on the word
        context.translate(image.width / 2, image.height / 2);
        context.transform(...matrixArgs(new DOMMatrix(getComputedStyle(target).transform)));
        const pieces = word.matches("[data-ink]") ? [word] : [...word.querySelectorAll<HTMLElement>("[data-ink]")];
        for (const piece of pieces) drawPiece(context, piece, target);

        blockPx = blockSize(parseFloat(getComputedStyle(word).fontSize));
        const { data } = context.getImageData(0, 0, image.width, image.height);
        return wordBlocks(data, image.width, image.height, blockPx, Math.random);
    }

    // One piece of the word in its font and ink, where it sits inside the anchor
    function drawPiece(context: CanvasRenderingContext2D, piece: HTMLElement, target: HTMLElement): void {
        const ink = COLORS.find((color) => color === piece.dataset.ink);
        if (!ink) return;
        const style = getComputedStyle(piece);
        const boxWidth = piece.offsetWidth;
        const boxHeight = piece.offsetHeight;
        context.save();
        // SYMMETRY: the piece, or the half of the word it lies in, only shows left of that half's middle
        const half = piece.closest<HTMLElement>("[data-left-half]");
        if (half) {
            context.transform(...matrixArgs(placement(half, target)));
            context.beginPath();
            context.rect(-CUT_REACH_PX, -CUT_REACH_PX, CUT_REACH_PX + half.offsetWidth / 2, 2 * CUT_REACH_PX);
            context.clip();
            context.transform(...matrixArgs(placement(piece, half)));
        } else {
            context.transform(...matrixArgs(placement(piece, target)));
        }
        context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        context.fillStyle = COLOR_CSS[ink];
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(piece.textContent ?? "", boxWidth / 2, boxHeight / 2);
        context.restore();
    }

    // From the piece's own box to `target` (the anchor, or a half of the word): the layout offsets and the transforms
    // of the piece and its positioned parents, each around its transform origin
    function placement(piece: HTMLElement, target: HTMLElement): DOMMatrix {
        let matrix = new DOMMatrix();
        for (
            let node: Element | null = piece;
            node instanceof HTMLElement && node !== target;
            node = node.offsetParent
        ) {
            const style = getComputedStyle(node);
            const [originX, originY] = style.transformOrigin.split(" ").map(parseFloat);
            const own = style.transform === "none" ? new DOMMatrix() : new DOMMatrix(style.transform);
            const local = new DOMMatrix()
                .translate(node.offsetLeft, node.offsetTop)
                .translate(originX, originY)
                .multiply(own)
                .translate(-originX, -originY);
            matrix = local.multiply(matrix);
        }
        return matrix;
    }

    function matrixArgs({ a, b, c, d, e, f }: DOMMatrix): [number, number, number, number, number, number] {
        return [a, b, c, d, e, f];
    }

    function shakeOffset(): number {
        return (Math.random() * 2 - 1) * SHAKE_PX;
    }
</script>

<div class="loss" style:transform style:opacity={frame.opacity}>
    <ChallengeScreen
        challenge={level.challenge}
        elapsed={frozen}
        timeLimit={level.timeLimit}
        spamCount={level.spamCount}
        {width}
        {height}
        hideWord={frame.shattered}
        bind:anchor
        {colorblind}
    />
    <TopBar
        level={level.level}
        {highscore}
        remaining={1 - frozen / level.timeLimit}
        countUp={level.challenge.modifiers.has("countUp")}
    />
    <TapHints flash={null} double={level.challenge.modifiers.has("doubleTap")} {flipControls} />
    <div class="frame" style:opacity={frame.frameOpacity} aria-hidden="true"></div>
    <div
        class="label"
        style:opacity={frame.labelOpacity}
        style:transform="translate(-50%, -50%) scale({frame.labelScale})"
        aria-hidden="true"
    >
        {FEEDBACK_LABELS[kind]}
    </div>
    <div class="whiteout" style:opacity={frame.whiteout} aria-hidden="true"></div>
</div>
<canvas class="blocks" bind:this={canvas} aria-hidden="true"></canvas>

<style>
    .loss,
    .frame,
    .whiteout,
    .blocks {
        position: absolute;
        inset: 0;
        pointer-events: none;
    }

    .frame {
        border: 10px solid var(--red);
    }

    .label {
        position: absolute;
        left: 50%;
        top: 68%;
        font-size: max(22px, calc(4 * var(--unit)));
        color: var(--red);
        white-space: nowrap;
        pointer-events: none;
    }

    .whiteout {
        background: #fff;
    }

    .blocks {
        width: 100%;
        height: 100%;
    }
</style>
