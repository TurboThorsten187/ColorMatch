# ColorMatch

Browser reaction game (Stroop effect): does the word match its ink color? Deployed to GitHub Pages
(https://turbothorsten187.github.io/ColorMatch/) by `.github/workflows/deploy.yml` on every push to `main`.

## Stack

Svelte 5 (runes) + TypeScript, Vite 8, Vitest, ESLint (flat config) + Prettier. Runtime dependencies besides Svelte:
self-hosted fonts via `@fontsource` (Press Start 2P for the UI, Orbitron 900 for the color word, plus 26 display fonts
for the Font Flip modifier, `FLIP_FONTS` in `src/ui/fonts.ts`; latin subsets only). `main.ts` awaits only the first two;
`loadFlipFonts()` runs in the background, and the service worker report waits for it so they are cached offline.
Sounds are chiptune sounds synthesized with Web Audio oscillators (recipes in `src/ui/synth.ts`), there are no audio
files.

## Commands

- `npm run dev` – dev server
- `npm run check` – lint, typecheck (svelte-check), tests, build; the same as CI, run before every commit
- `npm run format` – Prettier (4 spaces, 120 columns)

## Structure

- `src/game/` – pure game logic, no DOM and no Svelte: immutable `GameState` union and transitions
  `answer`/`confirm`/`toMenu`/`tick`/`pause`/`resume` that take `now` (ms) and an injected `Rng`. All gameplay rules live here and are unit tested.
  Every running state carries its `Mode` (`normal` or `hardcore`, `modeOf`); RETRY keeps it. Hardcore's rules are
  `mode` branches in `progression.ts` (no intros, base time 1 s, full tempo/strength/zoom, count every 3 levels, no
  plain levels, surges from `HARDCORE_SURGE_FIRST_LEVEL`); it opens at `HARDCORE_UNLOCK_SCORE` and keeps its own
  highscore key in `highscore.ts`.
  Wait (`isTooEarly`, `WAIT_SHARE`) and Double Tap (`PlayingState.taps`) are rules in `game.ts`; `twoWords` builds its
  second word in `createChallenge` (`Challenge.second`), Zoom's shrinking size is `Challenge.size`. The spam pause
  starts with `SPAM_BANG_MS` of the solved SPAM! (`isSpamBang`), which App draws from `spamDone`, frozen at the last press.
  Shown names may differ from the ids, which stay for saved stats: `blink` is FADE, `splitMirror` SYMMETRY, `countUp`
  REVERSE TIMER, `twoWords` DUO.
- `src/ui/` – one Svelte component per screen plus `TopBar` (level and highscore over a 24-block timer, which `AwardToast` sits below; the modifier cards reuse it `inline` and `paused`), `TapHints`, `FeedbackFlash`;
  modifiers are rendered with CSS transforms and filters; the rule tags (DON'T CLICK, INVERTED INPUT) sit in the
  word's anchor and get every effect too. The colorblind setting keeps the six colors internally but shows each as a
  shape: `SHAPE_WORDS`/`wordFor` in `src/game/colors.ts` give the words, `src/ui/shapes.ts` fills the letters
  (`inkStyle`) and the background modifier (`backgroundStyle`) with SVG shape tiles; every screen that shows a color
  word takes a `colorblind` prop. `LossScreen` plays the loss animation (timeline in
  `lossAnimation.ts`, driven by the time since the loss) before `GameOverScreen` switches on. `ChallengeScreen`
  draws every word (two for `twoWords`) with one snippet: as one text, or letter by letter for Font Flip, Assemble
  and SPAM!, inside `SplitMirror` (which renders it twice) for Symmetry; the Negative afterimage reuses it. Only the leaves
  carry `data-ink` (the plain word, a Symmetry half of plain text, or each letter), never their wrappers. Assemble's start points lie on the screen edges and are mapped
  into the transformed anchor with `toAnchor`; blur, the afterimage offset and the shake shrink with Zoom. The loss
  animation rasterizes the anchor's first child, every `data-ink` piece with its font, ink and transforms, cut at
  the middle of its closest `data-left-half`; blocks keep the pixel's color. Negative inverts App's `.playfield` (level, timer, hints) while `isNegative`; the low time frame
  (`lowTimeGlow`, from `LOW_TIME_SHARE` of real time left, also on Count Up) lies outside of it so it stays red. `src/main.ts` awaits `loadFonts()` before mounting because
  the word size is fitted by measuring the real font. `sound.ts` wraps Web Audio: `unlockAudio()` on every input
  (browsers need a gesture; on touch only `pointerup` counts), each sound is built from oscillators when it plays.
- `src/App.svelte` – the only stateful place: rAF loop, keyboard and pointer input (left/right screen half, mapped to
  an answer by `answerOn` in `settings.ts` because FLIP CONTROLS swaps them; every screen that names a side takes a
  `flipControls` prop; outside
  of a level arrow keys and WASD move the focus between buttons by position, `src/ui/spatialNav.ts`; the white
  highlight only shows while `keyboardMode` puts the `keys` class on the stage; a tapped or clicked button flashes
  white first, `flashButton` holds the click back for `BUTTON_FLASH_MS` and replays it, `data-no-flash` opts out; no
  button is white otherwise),
  pause on `blur`/`visibilitychange`, highscore, settings and stats persistence, sounds and stats for game transitions
  in `update()` (a hardcore game records no stats and no awards). Settings and stats screens are a `view` in App, not
  a game phase. The stage sets the six game colors as CSS variables (`--red` … `--cyan`); components use them, or
  `inkCss` from `src/ui/palette.svelte.ts` where they need the value in script, never hex values of their own, so every
  screen and the icon (`public/favicon.svg`, which has to be updated by hand) show exactly the game's colors. `inkCss`
  gives `COLOR_CSS`, or `OLD_COLOR_CSS` while the OLD COLORS setting is on; that setting only exists to compare the
  palettes while the design is reworked and goes again afterwards. The stage's `--accent` (`--yellow`, `--red` while a hardcore game runs)
  colors the highlights of every screen a game shows.
- `public/` – PWA files copied as-is: `manifest.webmanifest`, icons (the PNGs and `favicon.ico` are renders of
  `favicon.svg`, re-render them when it changes) and `sw.js`, a plain JS service worker (network first for the page,
  cache first for files). `main.ts` registers it in production builds only and reports the loaded files, so the cache
  holds exactly the current version. `src/ui/install.svelte.ts` keeps the browser's install offer for the menu's
  INSTALL button.
- The tutorial (`src/game/tutorial.ts`) runs beside the game state, which stays in the menu meanwhile. A level with a
  modifier never seen before is stored paused in `update()` until its intro cards (`src/game/intros.ts`) are confirmed.
- Awards are defined in `src/game/awards.ts`; `src/game/stats.ts` counts cleared levels per award, is saved after every
  cleared level and reports newly unlocked awards (toast in game, list on game over).
- Modifiers belong to groups (`MODIFIER_GROUPS` in `src/game/modifiers.ts`, all mirrors are one group) with a tier
  (easy, medium, hard: the intro order and the group's extra time).
  Groups that must not share a level name each other in `conflictsWith` (only one of them needs to), and a level
  has at most one `rule` group. With Symmetry the mirror group only turns the word upside down.
  `src/game/progression.ts` holds the per-game curriculum (`PlayingState.curriculum`: a new group every 3 levels from
  level 5, alone on its intro level; an intro due on a surge level moves to the level after it), the per-level pick
  (`maxGroupCount` grows by one every 12 levels; from level 40 to 80 plain levels die out and the count's weights move
  from mostly one to every count equally likely), surge levels (`isSurgeLevel`,
  announced by the `surgeBanner` phase; `surgeGroupCount` grows by one per surge, the time is a fixed
  `SURGE_TIME_MS`), the time limit (a base that bends from 3 s at level 1 to 1 s at level 80, every group adds
  `EXTRA_TIME_MS` of its tier, Don't Click levels get `NO_CLICK_TIME_SHARE` of it) and the tempo of animated modifiers
  (`tempoFor`, following the shrinking base up to `MAX_TEMPO` at level 80, stored in `Challenge.tempo`, applied in
  `ChallengeScreen` and `effects.ts`), and along with the tempo
  the strength (`strengthFor`, `Challenge.strength`, 0 on the intro level to 1 from level 80) that makes rotation
  uneven, widens pulse and shake, blurs more and picks the `wild` Font Flip fonts more often. A new modifier needs a
  group, an intro card, an award and, if animated, a function in `src/ui/effects.ts` driven by the level's `seed`, the
  elapsed time and its tempo.

## Conventions

- Keep game rules out of components; add them to `src/game/` with a colocated `*.test.ts`.
- Docs for players and setup are in `README.md` (German); code, comments and this file are English.
- Look: "Classic Arcade" (black, pixel font, scanlines, hard edges), dark only. Approved design prototypes:
  https://claude.ai/artifact/VKJWcc8fSgcsMTnLPURYGH (page "2 · Arcade details"). Sizes use `--unit` (1 % of the
  width, capped) with a px minimum for phones. No text below 10 px, card and button text at least 11 px; text that
  may wrap needs a `line-height` (the pixel font's default is too tight).
- `vite.config.ts` uses `base: "./"` so the build works under the `/ColorMatch/` Pages path.
