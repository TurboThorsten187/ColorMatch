<script lang="ts">
    import { COLOR_CSS } from "../game/colors.ts";
    import type { PlayingState } from "../game/game.ts";
    import ChallengeScreen from "./ChallengeScreen.svelte";
    import { FEEDBACK_LABELS, type FeedbackKind } from "./FeedbackFlash.svelte";
    import { WORD_FONT, WORD_WEIGHT } from "./fonts.ts";
    import {
        type Block,
        blockAt,
        blockSize,
        blocksOpacity,
        lossFrame,
        SHAKE_OFFSETS,
        wordBlocks,
    } from "./lossAnimation.ts";
    import TapHints from "./TapHints.svelte";
    import TopBar from "./TopBar.svelte";

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
    }

    let { level, lostAt, kind, elapsed, highscore, width, height, colorblind }: Props = $props();

    const SHAKE_PX = 7;

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
        context.fillStyle = COLOR_CSS[level.challenge.color];
        for (const block of blocks) {
            const { x, y } = blockAt(block, elapsed, height);
            context.fillRect(Math.round(x), Math.round(y), blockPx, blockPx);
        }
        context.globalAlpha = 1;
    });

    // Draws the word as it is on screen (rotated, mirrored, moved) into an image and cuts it into blocks
    function readBlocks(target: HTMLElement): readonly Block[] {
        const word = target.firstElementChild;
        const image = document.createElement("canvas");
        image.width = Math.round(width);
        image.height = Math.round(height);
        const context = image.getContext("2d", { willReadFrequently: true });
        if (!(word instanceof HTMLElement) || !context) return [];

        const fontSize = parseFloat(getComputedStyle(word).fontSize);
        // The anchor sits in the middle of the screen, its transform holds every effect on the word
        const { a, b, c, d, e, f } = new DOMMatrix(getComputedStyle(target).transform);
        context.translate(image.width / 2, image.height / 2);
        context.transform(a, b, c, d, e, f);
        context.font = `${WORD_WEIGHT} ${fontSize}px ${WORD_FONT}`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(word.textContent ?? "", 0, 0);

        blockPx = blockSize(fontSize);
        const { data } = context.getImageData(0, 0, image.width, image.height);
        return wordBlocks(data, image.width, image.height, blockPx, Math.random);
    }

    function shakeOffset(): number {
        return (Math.random() * 2 - 1) * SHAKE_PX;
    }
</script>

<div class="loss" style:transform style:opacity={frame.opacity}>
    <ChallengeScreen
        challenge={level.challenge}
        elapsed={frozen}
        spamCount={level.spamCount}
        {width}
        {height}
        hideWord={frame.shattered}
        bind:anchor
        {colorblind}
    />
    <TopBar level={level.level} {highscore} remaining={1 - frozen / level.timeLimit} />
    <TapHints flash={null} />
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
        border: 10px solid #ff3b4e;
    }

    .label {
        position: absolute;
        left: 50%;
        top: 68%;
        font-size: max(22px, calc(4 * var(--unit)));
        color: #ff3b4e;
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
