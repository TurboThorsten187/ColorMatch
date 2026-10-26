<script lang="ts">
    import { createChallenge } from "@/core/challenge.ts";
    import type { PlayingState } from "@/core/game.ts";
    import { introById } from "@/core/intros.ts";
    import { strengthFor, tempoFor, timeLimitFor } from "@/core/progression.ts";
    import { seededRng } from "@/core/random.ts";
    import { isNegative } from "@/modifiers/negative/look.ts";
    import { MODIFIER_GROUPS } from "@/modifiers/registry.ts";
    import type { ModifierGroupId } from "@/modifiers/types.ts";
    import LevelScreen from "@/ui/screens/LevelScreen.svelte";
    import ModifierIntroScreen from "@/ui/screens/ModifierIntroScreen.svelte";
    import Stage from "@/ui/Stage.svelte";
    import WordView from "@/ui/word/WordView.svelte";

    // For developers, on the dev server and in test builds: every modifier group drawn by the game's own renderer, so
    // a new one can be looked at without playing up to it. Everything is set in the URL:
    //   ?gallery                 one tile per group
    //   ?gallery=moving,shaky    one tile with these groups together
    //   &intro=rotation          the group's intro card instead
    //   &t=500                   the time stands still, at 500 ms into every level
    //   &level=80                tempo and strength of that level; every group came on level 5
    //   &colorblind              shapes instead of colors
    //   &screen                  the first tile as a whole level screen, as in a game (the store screenshots)
    //   &highscore=64            the highscore that screen shows
    //   &seed=3                  other words and colors

    const params = new URLSearchParams(window.location.search);
    const ids = new Set<string>(MODIFIER_GROUPS.map((group) => group.id));
    const isGroup = (id: string): id is ModifierGroupId => ids.has(id);

    const INTRO_LEVEL = 5;
    const TILE_WIDTH = 360;
    const TILE_HEIGHT = 270;
    const SPAM_STEP_MS = 300;

    const fixed = params.has("t") ? Number(params.get("t")) : null;
    const level = Number(params.get("level") ?? INTRO_LEVEL);
    const colorblind = params.has("colorblind");
    const intro = params.get("intro");
    const screen = params.has("screen");
    const highscore = Number(params.get("highscore") ?? 0);
    const seed = Number(params.get("seed") ?? 1);
    const chosen = (params.get("gallery") ?? "").split(",").filter(isGroup);
    const sets: ModifierGroupId[][] = chosen.length > 0 ? [chosen] : MODIFIER_GROUPS.map((group) => [group.id]);

    const tiles = sets.map((groups, index) => {
        const tempo = Object.fromEntries(groups.map((id) => [id, tempoFor(level, INTRO_LEVEL)]));
        const strength = Object.fromEntries(groups.map((id) => [id, strengthFor(level, INTRO_LEVEL)]));
        const context = { level, mode: "normal" as const, introducedOn: () => INTRO_LEVEL };
        return {
            name: groups.map((id) => introById(id).title).join(" + "),
            groups,
            challenge: createChallenge(groups, seededRng(seed + index), context, tempo, strength),
            timeLimit: timeLimitFor(level, groups, level === INTRO_LEVEL),
        };
    });

    let now = $state(0);
    let width = $state(0);
    let height = $state(0);

    $effect(() => {
        if (fixed !== null) return;
        let frame = requestAnimationFrame(function loop(time) {
            now = time;
            frame = requestAnimationFrame(loop);
        });
        return () => cancelAnimationFrame(frame);
    });

    const time = $derived(fixed ?? now);

    // The first tile as a running level that started at 0 and starts over when its time is up
    const first = tiles[0];
    const playing: PlayingState = {
        phase: "playing",
        level,
        challenge: first.challenge,
        startedAt: 0,
        timeLimit: first.timeLimit,
        spamCount: 0,
        taps: 0,
        curriculum: [],
        mode: "normal",
    };

    // This page's URL with some parameters changed; null removes one, "" keeps only its name
    function link(changes: Record<string, string | null>): string {
        const merged = { ...Object.fromEntries(params), ...changes };
        const parts = Object.entries(merged).flatMap(([key, value]) =>
            value === null ? [] : [value === "" ? key : `${key}=${encodeURIComponent(value)}`],
        );
        return `?${parts.join("&")}`;
    }
</script>

<Stage keys={false} hardcore={false} scanlines={false} keyHelp={false} bind:width bind:height>
    {#if screen}
        <LevelScreen
            level={playing}
            time={time % first.timeLimit}
            {highscore}
            {width}
            {height}
            {colorblind}
            flipControls={false}
            flash={null}
        />
    {:else if intro && isGroup(intro)}
        <ModifierIntroScreen
            intro={introById(intro)}
            level={INTRO_LEVEL}
            elapsed={time}
            {colorblind}
            flipControls={false}
            ongotit={() => (window.location.search = link({ intro: null }))}
        />
    {:else}
        <div class="gallery">
            <nav>
                <a href={link({ colorblind: colorblind ? null : "" })}>COLORBLIND {colorblind ? "ON" : "OFF"}</a>
                <a href={link({ level: level === INTRO_LEVEL ? "80" : null })}>LEVEL {level}</a>
                <a href={link({ gallery: "" })}>ALL</a>
            </nav>
            <div class="tiles">
                {#each tiles as tile (tile.name)}
                    {@const elapsed = time % tile.timeLimit}
                    <figure>
                        <div
                            class="box"
                            style:filter={tile.challenge.modifiers.has("negative") &&
                            isNegative(elapsed, tile.timeLimit)
                                ? "invert(1)"
                                : null}
                            data-tile={tile.groups.join(",")}
                        >
                            <WordView
                                challenge={tile.challenge}
                                {elapsed}
                                timeLimit={tile.timeLimit}
                                spamCount={Math.floor(elapsed / SPAM_STEP_MS) % (tile.challenge.presses + 1)}
                                width={TILE_WIDTH}
                                height={TILE_HEIGHT}
                                {colorblind}
                            />
                        </div>
                        <figcaption>
                            {#each tile.groups as id (id)}
                                <a href={link({ intro: id })}>{introById(id).title}</a>
                            {/each}
                        </figcaption>
                    </figure>
                {/each}
            </div>
        </div>
    {/if}
</Stage>

<style>
    .gallery {
        position: absolute;
        inset: 0;
        overflow-y: auto;
        touch-action: pan-y;
        padding: 16px;
        font-size: var(--text-small);
        line-height: 1.8;
    }

    nav {
        display: flex;
        gap: 24px;
        margin-bottom: 16px;
    }

    a {
        color: var(--accent);
    }

    .tiles {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
    }

    figure {
        margin: 0;
    }

    .box {
        position: relative;
        width: 360px;
        height: 270px;
        overflow: hidden;
        outline: var(--line) solid var(--line-faint);
    }

    figcaption {
        display: flex;
        gap: 12px;
        margin-top: 8px;
    }
</style>
