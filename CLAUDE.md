# ColorMatch

Browser reaction game (Stroop effect): does the word match its ink color? Deployed to GitHub Pages
(https://turbothorsten187.github.io/ColorMatch/) by `.github/workflows/deploy.yml` on every push to `main`.

## Stack

Svelte 5 (runes) + TypeScript, Vite 8, Vitest, ESLint (flat config) + Prettier. Runtime dependencies besides Svelte:
self-hosted fonts via `@fontsource` (Press Start 2P for the UI, Orbitron 900 for the color word, latin subsets only).
Sounds are Kenney CC0 OGG files in `src/assets/sounds/` (source names in the README credits), imported as Vite assets.

## Commands

- `npm run dev` – dev server
- `npm run check` – lint, typecheck (svelte-check), tests, build; the same as CI, run before every commit
- `npm run format` – Prettier (4 spaces, 120 columns)

## Structure

- `src/game/` – pure game logic, no DOM and no Svelte: immutable `GameState` union and transitions
  `answer`/`confirm`/`toMenu`/`tick`/`pause`/`resume` that take `now` (ms) and an injected `Rng`. All gameplay rules live here and are unit tested.
- `src/ui/` – one Svelte component per screen plus `TopBar` (level, timer), `TapHints`, `FeedbackFlash`;
  modifiers are rendered with CSS transforms and filters. `src/main.ts` awaits `loadFonts()` before mounting because
  the word size is fitted by measuring the real font. `sound.ts` wraps Web Audio: `unlockAudio()` on every input
  (browsers need a gesture; on touch only `pointerup` counts), sounds are decoded once.
- `src/App.svelte` – the only stateful place: rAF loop, keyboard and pointer input (left/right screen half),
  pause on `blur`/`visibilitychange`, highscore, settings and stats persistence, sounds and stats for game transitions
  in `update()`. Settings and stats screens are a `view` in App, not a game phase.
- Awards are defined in `src/game/awards.ts`; `src/game/stats.ts` counts cleared levels per award, is saved after every
  cleared level and reports newly unlocked awards (toast in game, list on game over).

## Conventions

- Keep game rules out of components; add them to `src/game/` with a colocated `*.test.ts`.
- Docs for players and setup are in `README.md` (German); code, comments and this file are English.
- Look: "Classic Arcade" (black, pixel font, scanlines, hard edges), dark only. Approved design prototypes:
  https://claude.ai/artifact/VKJWcc8fSgcsMTnLPURYGH (page "2 · Arcade details"). Sizes use `--unit` (1 % of the
  width, capped) with a px minimum for phones.
- `vite.config.ts` uses `base: "./"` so the build works under the `/ColorMatch/` Pages path.
