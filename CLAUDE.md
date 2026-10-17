# ColorMatch

Browser reaction game (Stroop effect): does the word match its ink color? Deployed to GitHub Pages
(https://turbothorsten187.github.io/ColorMatch/) by `.github/workflows/deploy.yml` on every push to `main`.

## Stack

Svelte 5 (runes) + TypeScript, Vite 8, Vitest, ESLint (flat config) + Prettier. No runtime dependencies besides Svelte.

## Commands

- `npm run dev` – dev server
- `npm run check` – lint, typecheck (svelte-check), tests, build; the same as CI, run before every commit
- `npm run format` – Prettier (4 spaces, 120 columns)

## Structure

- `src/game/` – pure game logic, no DOM and no Svelte: immutable `GameState` union and transitions
  `answer`/`tick`/`startGame` that take `now` (ms) and an injected `Rng`. All gameplay rules live here and are unit tested.
- `src/ui/` – one Svelte component per screen; modifiers are rendered with CSS transforms and filters.
- `src/App.svelte` – the only stateful place: rAF loop, keyboard input, highscore persistence.

## Conventions

- Keep game rules out of components; add them to `src/game/` with a colocated `*.test.ts`.
- Docs for players and setup are in `README.md` (German); code, comments and this file are English.
- `vite.config.ts` uses `base: "./"` so the build works under the `/ColorMatch/` Pages path.
