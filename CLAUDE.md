# ColorMatch

Browser reaction game (Stroop effect): does the word match its ink color? Deployed to GitHub Pages
(https://turbothorsten187.github.io/ColorMatch/) by `.github/workflows/deploy.yml` on every push to `main`.

## Stack

Svelte 5 (runes) + TypeScript, Vite 8, Vitest, Playwright, ESLint (flat config) + Prettier. Runtime dependencies besides Svelte:
self-hosted fonts via `@fontsource` (Press Start 2P for the UI, Orbitron 900 for the color word, plus 26 display fonts
for the Font Flip modifier, `FLIP_FONTS` in `src/platform/fonts.ts`; latin subsets only). `main.ts` awaits only the first two;
`loadFlipFonts()` runs in the background, and the service worker report waits for it so they are cached offline.
Sounds are chiptune sounds synthesized with Web Audio oscillators (recipes in `src/platform/synth.ts`), there are no audio
files.

## Commands

- `npm run dev` – dev server
- `npm run check` – lint, typecheck (svelte-check, `tsc -p e2e`), unit tests, build; run before every commit
- `npm run test:e2e` – Playwright browser tests (`e2e/`) against `npm run build:e2e`; CI runs them besides `check`
  and deploys only when both pass. Run them too when a change touches the UI or `App.svelte`. They need a Chromium:
  `npx playwright install chromium`, or `CHROMIUM_PATH` pointing to an installed one (in Claude Code cloud sessions
  `CHROMIUM_PATH=/opt/pw-browsers/chromium`)
- `npm run format` – Prettier (4 spaces, 120 columns)

## Structure

Imports go one way: `src/ui/` → `src/app/` → `src/core/`, with `src/platform/` (the browser) beside `app`. Across
folders they start at `src/` (`@/core/game.ts`), within a folder they are relative (`./game.ts`); ESLint's
`no-restricted-imports` blocks every other direction and `../` paths (`eslint.config.js`).

- `src/core/` – pure game logic, no DOM, no Svelte and no storage: immutable `GameState` union and transitions
  `answer`/`confirm`/`toMenu`/`tick`/`pause`/`resume` that take `now` (ms) and an injected `Rng`. All gameplay rules live here and are unit tested.
  Every running state carries its `Mode` (`normal` or `hardcore`, `modeOf`); RETRY keeps it. Hardcore's rules are
  `mode` branches in `progression.ts` (no intros, base time 1 s, full tempo/strength/zoom, count every 3 levels, no
  plain levels, surges from `HARDCORE_SURGE_FIRST_LEVEL`); it opens at `HARDCORE_UNLOCK_SCORE` and keeps its own
  highscore (`Highscores` in `highscore.ts`).
  Wait (`isTooEarly`, `WAIT_SHARE`) and Double Tap (`PlayingState.taps`) are rules in `game.ts`; `twoWords` builds its
  second word in `createChallenge` (`Challenge.second`), Zoom's shrinking size is `Challenge.size`. The spam pause
  starts with `SPAM_BANG_MS` of the solved SPAM! (`isSpamBang`), which App draws from `spamDone`, frozen at the last press.
  Shown names may differ from the ids, which stay for saved stats: `blink` is FADE, `splitMirror` SYMMETRY, `countUp`
  REVERSE TIMER, `twoWords` DUO.
- `src/core/save.ts` – everything kept between visits as one `SaveData` (settings, highscores, stats, tutorial progress),
  stored as one JSON object with `SAVE_VERSION` under one key by `src/platform/storage.ts`. Each part has a pure
  `parse…` function in its module that reads stored JSON field by field, every invalid field falling back on its own.
  A format change that older saves cannot be read with bumps `SAVE_VERSION`, and `parseSave` has to convert the older
  versions or they start over. `writeSave` never lowers a highscore (another tab may have saved a better one); version
  1 started every save anew and `removeOldSaves` deletes the keys of the format before it.
- `src/platform/` – the browser: storage, Web Audio (`sound.ts`, `synth.ts`), fonts, the install offer, the test seed.
- `src/app/` – game flow logic without components: spatial navigation, the award toast queue.
- `src/ui/` – `screens/` has one Svelte component per screen, `hud/` what lies over a level (`TopBar` (level and highscore over a 24-block timer, which `AwardToast` sits below; the modifier cards reuse it `inline` and `paused`), `TapHints`, `FeedbackFlash`, `AwardToast`, `AwardBadge`), `word/` the word and its modifiers (`ChallengeScreen`,
  `SplitMirror`, `RuleSign`, `effects.ts`, `fontFlip.ts`, `fitText.ts`, `shapes.ts`, `ruleIcons.ts`);
  modifiers are rendered with CSS transforms and filters; the rule tags (DON'T CLICK, INVERTED INPUT) sit in the
  word's anchor and get every effect too. `RuleSign` draws them, here and on the intro cards, with the rule's pixel icon
  from `src/ui/word/ruleIcons.ts` at both ends (a `directed` icon is mirrored at the end, so both face the text). The colorblind setting keeps the six colors internally but shows each as a
  shape: `SHAPE_WORDS`/`wordFor` in `src/core/colors.ts` give the words, `src/ui/word/shapes.ts` fills the letters
  (`inkStyle`) and the background modifier (`backgroundStyle`) with SVG shape tiles; every screen that shows a color
  word takes a `colorblind` prop. The shapes are about as wide as the letters' strokes on phones, so groups that blur,
  shrink or shake them (`hidesShapes` in `MODIFIER_GROUPS`) are left out of a colorblind game's curriculum
  (`startGame`/`confirm` take the setting), and Font Flip only uses the `thick` fonts there. `LossScreen` plays the loss animation (timeline in
  `screens/lossAnimation.ts`, driven by the time since the loss) before `GameOverScreen` switches on. `ChallengeScreen`
  draws every word (two for `twoWords`) with one snippet: as one text, or letter by letter for Font Flip, Assemble
  and SPAM!, inside `SplitMirror` (which renders it twice) for Symmetry; the Negative afterimage reuses it. Only the leaves
  carry `data-ink` (the plain word, a Symmetry half of plain text, or each letter), never their wrappers. Assemble's start points lie on the screen edges and are mapped
  into the transformed anchor with `toAnchor`; the afterimage offset and the shake shrink with Zoom (Zoom and Blur never share a level). The loss
  animation rasterizes the anchor's first child, every `data-ink` piece with its font, ink and transforms, cut at
  the middle of its closest `data-left-half`; blocks keep the pixel's color. Negative inverts App's `.playfield` (level, timer, hints) while `isNegative`; the low time frame
  (`lowTimeGlow`, from `LOW_TIME_SHARE` of real time left, also on Count Up) lies outside of it so it stays red. `src/main.ts` awaits `loadFonts()` before mounting because
  the word size is fitted by measuring the real font. `src/platform/sound.ts` wraps Web Audio: `unlockAudio()` on every input
  (browsers need a gesture; on touch only `pointerup` counts), each sound is built from oscillators when it plays.
- `src/App.svelte` – the only stateful place: rAF loop, keyboard and pointer input (left/right screen half, mapped to
  an answer by `answerOn` in `settings.ts` because FLIP CONTROLS swaps them; every screen that names a side takes a
  `flipControls` prop; outside
  of a level arrow keys and WASD move the focus between buttons by position, `src/app/spatialNav.ts`, and a moved
  mouse focuses the button under it (`selectHovered`); the selection only shows while `keyboardMode` puts the `keys`
  class on the stage, together with the `key-help` strip, for which every screen with buttons keeps 40 px free at the
  bottom. App's global button CSS colors border and text of the selected button in its `--button-color` (the accent
  without one); a pressed button (tap, click, Enter, Space) shrinks a little first, `pressButton` holds the click back
  for `BUTTON_PRESS_MS` and replays it, `data-no-press` opts out. Buttons have no shadows. Menu and game over redefine
  `--unit` with a stronger height cap, so low browser windows fit without scrolling; SETTINGS shrinks its rows and gaps
  with the height instead),
  pause on `blur`/`visibilitychange`, the save (`persist()` writes all of it on every change, `onStorage` takes over
  what another tab saved), sounds and stats for game transitions in `update()` (a hardcore game records no stats and
  no awards). Settings and stats screens are a `view` in App, not
  a game phase. The stage sets the six game colors as CSS variables (`--red` … `--cyan`); components use them, or
  `COLOR_CSS` from `src/core/colors.ts` where they need the value in script, never hex values of their own, so every
  screen and the icon (`public/favicon.svg`, which has to be updated by hand) show exactly the game's colors. The
  stage's `--accent` (`--yellow`, `--red` while a hardcore game runs)
  colors the highlights of every screen a game shows.
- `public/` – PWA files copied as-is: `manifest.webmanifest`, icons (the PNGs and `favicon.ico` are renders of
  `favicon.svg`, re-render them when it changes) and `sw.js`, a plain JS service worker (network first for the page,
  cache first for files). `main.ts` registers it in production builds only and reports the loaded files, so the cache
  holds exactly the current version. `src/platform/install.svelte.ts` keeps the browser's install offer for the menu's
  INSTALL button.
- The tutorial (`src/core/tutorial.ts`) runs beside the game state, which stays in the menu meanwhile. A level with a
  modifier never seen before is stored paused in `update()` until its intro cards (`src/core/intros.ts`) are confirmed.
- Awards are defined in `src/core/awards.ts`; `src/core/stats.ts` counts cleared levels per award, is saved after every
  cleared level and reports newly unlocked awards (toast in game, list on game over).
- Modifiers belong to groups (`MODIFIER_GROUPS` in `src/core/modifiers.ts`, all mirrors are one group) with a tier
  (easy, medium, hard: the intro order and the group's extra time).
  Groups that must not share a level name each other in `conflictsWith` (only one of them needs to), and a level
  has at most one `rule` group. With Symmetry the mirror group only turns the word upside down.
  `src/core/progression.ts` holds the per-game curriculum (`PlayingState.curriculum`: a new group every 3 levels from
  level 5, alone on its intro level; an intro due on a surge level moves to the level after it), the per-level pick
  (`maxGroupCount` grows by one every 12 levels; from level 40 to 80 plain levels die out and the count's weights move
  from mostly one to every count equally likely), surge levels (`isSurgeLevel`,
  announced by the `surgeBanner` phase; `surgeGroupCount` grows by one per surge, the time is a fixed
  `SURGE_TIME_MS`), the time limit (a base that bends from 3 s at level 1 to 1 s at level 80, every group adds
  `EXTRA_TIME_MS` of its tier, DUO adds `DUO_EXTRA_MS` on top, on a surge too, Don't Click levels get
  `NO_CLICK_TIME_SHARE` of it) and the tempo of animated modifiers
  (`tempoFor`, following the shrinking base up to `MAX_TEMPO` (1.5) at level 80, stored in `Challenge.tempo`, applied in
  `ChallengeScreen` and `effects.ts`), and along with the tempo
  the strength (`strengthFor`, `Challenge.strength`, 0 on the intro level to 1 from level 80) that makes rotation
  uneven, widens pulse and shake, blurs more and picks the `wild` Font Flip fonts more often; at strength 1 every such
  effect is at most 1.5 times what it is at 0. A new modifier needs a
  group, an intro card, an award and, if animated, a function in `src/ui/word/effects.ts` driven by the level's `seed`, the
  elapsed time and its tempo.

## Conventions

- Keep game rules out of components; add them to `src/core/` with a colocated `*.test.ts`.
- Docs for players and setup are in `README.md` (German); code, comments and this file are English.
- Look: "Classic Arcade" (black, pixel font, scanlines, hard edges), dark only. Approved design prototypes:
  https://claude.ai/artifact/VKJWcc8fSgcsMTnLPURYGH (page "2 · Arcade details"). Sizes use `--unit` (1 % of the
  width, capped) with a px minimum for phones. No text below 10 px, card and button text at least 11 px; text that
  may wrap needs a `line-height` (the pixel font's default is too tight).
- `e2e/` – browser tests that play the game like a player: they find things by role, label and text, and read the
  word's answer from its text and `data-ink`, never from CSS classes or component internals. Keep those stable, or
  change the helpers in `e2e/helpers.ts` with them. The e2e build and the dev server take a fixed random seed from the
  URL (`?seed=42`, `src/platform/testRng.ts`), so a game can be played again exactly; production builds leave that out.
- `vite.config.ts` uses `base: "./"` so the build works under the `/ColorMatch/` Pages path.
