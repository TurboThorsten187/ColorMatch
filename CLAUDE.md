# ColorMatch

Browser reaction game (Stroop effect): does the word match its ink color? Deployed to GitHub Pages
(https://turbothorsten187.github.io/ColorMatch/) by `.github/workflows/deploy.yml` on every push to `main`.

## Stack

Svelte 5 (runes) + TypeScript, Vite 8, Vitest, ESLint (flat config) + Prettier. Runtime dependencies besides Svelte:
self-hosted fonts via `@fontsource` (Press Start 2P for the UI, Orbitron 900 for the color word, latin subsets only).
Sounds are chiptune sounds synthesized with Web Audio oscillators (recipes in `src/ui/synth.ts`), there are no audio
files.

## Commands

- `npm run dev` – dev server
- `npm run check` – lint, typecheck (svelte-check), tests, build; the same as CI, run before every commit
- `npm run format` – Prettier (4 spaces, 120 columns)

## Structure

- `src/game/` – pure game logic, no DOM and no Svelte: immutable `GameState` union and transitions
  `answer`/`confirm`/`toMenu`/`tick`/`pause`/`resume` that take `now` (ms) and an injected `Rng`. All gameplay rules live here and are unit tested.
- `src/ui/` – one Svelte component per screen plus `TopBar` (level, timer), `TapHints`, `FeedbackFlash`;
  modifiers are rendered with CSS transforms and filters. `LossScreen` plays the loss animation (timeline in
  `lossAnimation.ts`, driven by the time since the loss) before `GameOverScreen` switches on. `src/main.ts` awaits `loadFonts()` before mounting because
  the word size is fitted by measuring the real font. `sound.ts` wraps Web Audio: `unlockAudio()` on every input
  (browsers need a gesture; on touch only `pointerup` counts), each sound is built from oscillators when it plays.
- `src/App.svelte` – the only stateful place: rAF loop, keyboard and pointer input (left/right screen half),
  pause on `blur`/`visibilitychange`, highscore, settings and stats persistence, sounds and stats for game transitions
  in `update()`. Settings and stats screens are a `view` in App, not a game phase.
- The tutorial (`src/game/tutorial.ts`) runs beside the game state, which stays in the menu meanwhile. A level with a
  modifier never seen before is stored paused in `update()` until its intro cards (`src/game/intros.ts`) are confirmed.
- Awards are defined in `src/game/awards.ts`; `src/game/stats.ts` counts cleared levels per award, is saved after every
  cleared level and reports newly unlocked awards (toast in game, list on game over).
- Modifiers belong to groups (`MODIFIER_GROUPS` in `src/game/modifiers.ts`, all mirrors are one group) with a tier.
  `src/game/progression.ts` holds the per-game curriculum (`PlayingState.curriculum`: a new group every 3 levels from
  level 5, alone on its intro level), the per-level pick, the late game ramp from level 40, surge levels (`isSurgeLevel`,
  announced by the `surgeBanner` phase), the time limit and the tempo of animated modifiers
  (`tempoFor`, stored in `Challenge.tempo`, applied in `ChallengeScreen` and `effects.ts`). A new modifier needs a
  group, an intro card, an award and, if animated, a function in `src/ui/effects.ts` driven by the level's `seed`, the
  elapsed time and its tempo.

## Conventions

- Keep game rules out of components; add them to `src/game/` with a colocated `*.test.ts`.
- Docs for players and setup are in `README.md` (German); code, comments and this file are English.
- Look: "Classic Arcade" (black, pixel font, scanlines, hard edges), dark only. Approved design prototypes:
  https://claude.ai/artifact/VKJWcc8fSgcsMTnLPURYGH (page "2 · Arcade details"). Sizes use `--unit` (1 % of the
  width, capped) with a px minimum for phones.
- `vite.config.ts` uses `base: "./"` so the build works under the `/ColorMatch/` Pages path.
