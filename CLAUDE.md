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

Imports go one way: `src/ui/` → `src/app/` → `src/core/` → `src/modifiers/`, with `src/platform/` (the browser)
beside `app`. The modifier definitions take only types from `core` (and its leaf modules `colors.ts`, `random.ts`), so
nothing depends on itself when the game loads. Across folders imports start at `src/` (`@/core/game.ts`), within a
folder they are relative (`./game.ts`); ESLint's `no-restricted-imports` blocks every other direction and `../` paths
(`eslint.config.js`).

- `src/core/` – pure game logic, no DOM, no Svelte and no storage: immutable `GameState` union and transitions
  `answer`/`confirm`/`toMenu`/`tick`/`pause`/`resume` that take `now` (ms) and an injected `Rng`. All gameplay rules live here and are unit tested.
  Every running state carries its `Mode` (`normal` or `hardcore`, `modeOf`); RETRY keeps it. Hardcore's rules are
  `mode` branches in `progression.ts` (no intros, base time 1 s, full tempo/strength/zoom, count every 3 levels, no
  plain levels, surges from `HARDCORE_SURGE_FIRST_LEVEL`); it opens at `HARDCORE_UNLOCK_SCORE` and keeps its own
  highscore (`Highscores` in `highscore.ts`). The numbers that tune the difficulty are in `balance.ts`, except those of
  a single modifier. A lost game keeps how (`GameOverState.reason`: miss, early, timeout) and the level it was lost on
  (`lost`). `events.ts` turns a transition into what happened (`gameEvents`: started, cleared with the reaction time,
  spamTap, surge, levelBegan, lost, resumed, menu), so nothing outside of core compares states.
  `createChallenge` builds a level's challenge from its groups' definitions: one variant each, the rule group's
  `expected` input, `presses` (DOUBLE TAP, SPAM!) and `lockedShare` (WAIT, `isTooEarly`), then the groups' `words`
  (DUO's `second` word) and `decorate` hooks (background, rotation start, Zoom's `size`), so `game.ts` asks for no
  modifier by name; `Challenge.groups` lists the groups in registry order. `testChallenge.ts` builds one for tests the
  same way. The spam pause
  starts with `SPAM_BANG_MS` of the solved SPAM! (`isSpamBang`), drawn from `SpamPauseState.solved` at `solvedAt`.
  Shown names may differ from the ids, which stay for saved stats: `blink` is FADE, `splitMirror` SYMMETRY, `countUp`
  REVERSE TIMER, `twoWords` DUO.
- `src/modifiers/` – one folder per modifier group with its definition (`ModifierGroup` in `types.ts`): tier,
  variants, `conflictsWith`, `hidesShapes`, the `rule` (how it changes what solves a level), `extraTimeMs`, the hooks
  above, the rule `sign` with its pixel icons, the intro card with the `demo` its example plays, and the award text,
  plus the numbers of that modifier alone (`WAIT_SHARE`, `SPAM_PRESSES_NEEDED`, `DUO_EXTRA_MS`, the Zoom sizes …).
  A folder's `look.ts` holds how the modifier looks, as pure functions of the level's seed, the time it `played` (the
  elapsed time at its tempo) and its strength, tested in `look.test.ts`; `src/modifiers/look.ts` has what they share
  (`noise`, `lerp`). `registry.ts` lists the groups (`MODIFIER_GROUPS`, `groupById`, `conflicts`, `inGroupOrder`); a
  group missing there does not compile, and its tests check every definition for completeness. **A new modifier**
  needs its ids in `types.ts`, a folder with its definition, an entry in `registry.ts` and in `MODIFIER_AWARD_ORDER`
  (`src/core/awards.ts`, a test checks it), and if it changes how the word looks, a `look.ts` used by
  `src/ui/word/wordFrame.ts`; a new kind of rule may need a new hook. `?gallery` on the dev server shows it at once.
- `src/core/save.ts` – everything kept between visits as one `SaveData` (settings, highscores, stats, tutorial progress),
  stored as one JSON object with `SAVE_VERSION` under one key by `src/platform/storage.ts`. Each part has a pure
  `parse…` function in its module that reads stored JSON field by field, every invalid field falling back on its own.
  A format change that older saves cannot be read with bumps `SAVE_VERSION`, and `parseSave` has to convert the older
  versions or they start over. `writeSave` never lowers a highscore (another tab may have saved a better one); version
  1 started every save anew and `removeOldSaves` deletes the keys of the format before it.
- `src/platform/` – the browser: storage, Web Audio (`sound.ts`, `synth.ts`), fonts, the install offer, the test seed.
- `src/app/session.svelte.ts` – `Session`, the only stateful place: the game state and its clock (`frame` per animation
  frame), the tutorial beside it (the game stays in the menu meanwhile), the intro cards (a level whose `levelBegan`
  shows a modifier never seen before is kept paused until its cards are confirmed), the view (settings and stats are
  no game phase), the save (`#changeSave` writes all of it on every change, `reload` takes over what another tab
  saved), stats, awards and their toasts (a hardcore game records no stats and no awards), and what each input means
  on each screen (`side`, `tap`, `enter`, `back`, `answers`; the left and right screen halves and keys are mapped to an
  answer by `answerOn` in `settings.ts` because FLIP CONTROLS swaps them). It reports what the player should hear as
  `SessionEvent`s; storage, random numbers, the clock and those listeners are passed in, so it is tested without a
  browser. `keys.ts` maps keys to sides, directions and back, `spatialNav.ts` finds the button in a direction,
  `toastQueue.ts` times the award toasts.
- `src/ui/kit/` – the building blocks of the screens, styled with the values of `tokens.css` (grays by use, `--line`
  and `--line-bold` frames, `--text-tiny` … `--text-large`, `--key-help-room`). `Button` (`small` 44 px or `large`
  56 px, `square`, `color` to be selected in, `ink`/`line` for colored text and frame) gives way for `PRESS_MS`
  (its `data-press` state, which the stage colors and shrinks) before it acts, so the press shows even when the
  screen changes; `instant` buttons (`Toggle`, the `Slider` steps) act at once and only show it. `Screen` is a whole
  screen inside the safe area with `--key-help-room` free at the bottom (`scroll`, `narrow` for the 460 px column; its
  child fills the height). `ScreenHead` is ◄ and a title, `Card` the framed card of the tutorial and the modifier
  cards. A screen sizes them through CSS variables on a surrounding element (`--button-height`, `--button-width`,
  `--button-flex`, `--button-font`, `--button-padding`, `--card-gap`, `--card-padding`), never by styling their
  insides. HOLD TO RESET and the award badges are plain buttons: they act on their own terms.
- `src/ui/` – `Stage.svelte` is the frame of every screen, `Screens.svelte` picks the screen the session is on,
  `sounds.ts` turns `SessionEvent`s into sounds timed to the screens (`cuesFor`). `screens/` has one Svelte component
  per screen (`LevelScreen` is a running level, also the solved SPAM! frozen at its last press), `hud/` what lies over a level (`TopBar` (level and highscore over a 24-block timer, which `AwardToast` sits below; the modifier cards reuse it `inline` and `paused`), `TapHints`, `FeedbackFlash`, `AwardToast`, `AwardBadge`), `word/` the word and its modifiers (`WordView`,
  `wordFrame.ts`, `SplitMirror`, `RuleSign`, `fontFlip.ts`, `fitText.ts`, `shapes.ts`, `pixelIcon.ts`), `dev/` the
  modifier gallery. One pipeline draws every word, in a level, the tutorial, the loss animation and on the intro cards:
  `wordFrame()` turns a challenge, the time and a box with its `Layout` (`STAGE`, or `CARD` for an intro card's
  example box) into a `WordFrame` (the lines and their letters, font size, the anchor's transform, opacity, blur,
  signs, afterimage), calling the modifiers' `look.ts`; it is pure apart from measuring text and unit tested.
  `WordView` puts the frame on screen with CSS transforms and filters. The rule signs (DON'T CLICK, INVERTED INPUT)
  sit in the word's anchor and get every effect too; a card shows none, its text explains the rule. `RuleSign` draws them, here and on the intro cards, with the pixel icon of the
  group's `sign` at both ends (`src/ui/word/pixelIcon.ts`) (a `directed` icon is mirrored at the end, so both face the text). The colorblind setting keeps the six colors internally but shows each as a
  shape: `SHAPE_WORDS`/`wordFor` in `src/core/colors.ts` give the words, `src/ui/word/shapes.ts` fills the letters
  (`inkStyle`) and the background modifier (`backgroundStyle`) with SVG shape tiles; every screen that shows a color
  word takes a `colorblind` prop. The shapes are about as wide as the letters' strokes on phones, so groups that blur,
  shrink or shake them (`hidesShapes` in their definitions) are left out of a colorblind game's curriculum
  (`startGame`/`confirm` take the setting), and Font Flip only uses the `thick` fonts there. `LossScreen` plays the loss animation (timeline in
  `screens/lossAnimation.ts`, driven by the time since the loss) before `GameOverScreen` switches on. `WordView`
  draws every word (two for `twoWords`) with one snippet: as one text, or letter by letter for Font Flip, Assemble
  and SPAM!, inside `SplitMirror` (which renders it twice) for Symmetry; the Negative afterimage reuses it. Only the leaves
  carry `data-ink` (the plain word, a Symmetry half of plain text, or each letter), never their wrappers. Assemble's start points lie on the screen edges and are mapped
  into the transformed anchor with `toAnchor`; the afterimage offset and the shake shrink with Zoom (Zoom and Blur never share a level). The loss
  animation rasterizes the anchor's first child, every `data-ink` piece with its font, ink and transforms, cut at
  the middle of its closest `data-left-half`; blocks keep the pixel's color. Negative inverts `LevelScreen`'s `.playfield` (level, timer, hints) while `isNegative`, an intro card its example box; the low time frame
  (`hud/lowTimeGlow.ts`, from `LOW_TIME_SHARE` in `core/game.ts` of real time left, also on Count Up) lies outside of it so it
  stays red. `src/main.ts` awaits `loadFonts()` before mounting because
  the word size is fitted by measuring the real font. `src/platform/sound.ts` wraps Web Audio: `unlockAudio()` on every input
  (browsers need a gesture; on touch only `pointerup` counts), each sound is built from oscillators when it plays.
- `src/App.svelte` – the browser side: creates the `Session` (with `localStorage`, `performance.now`, the URL seed,
  `playEvent` and `configureSound`), runs the rAF loop, and turns window input into session calls: keys, pointer
  (left/right screen half), pause on `blur`/`visibilitychange`, `storage` events. Every screen that names a side takes
  a `flipControls` prop. Outside of a level arrow keys and WASD move the focus between buttons by position
  (`moveFocus` in `src/ui/focus.ts`), and a moved mouse focuses the button under it (`focusHovered`); the selection
  only shows while `keyboardMode` puts the `keys` class on the stage, together with the `key-help` strip, for which
  every screen with buttons keeps `--key-help-room` free at the bottom (0 on short screens, which hide the strip).
  `Stage`'s global button CSS colors border and text of the selected and of the pressed button in its
  `--button-color` (the accent without one) and shrinks a pressed one a little. Buttons have no shadows. Menu and game over redefine `--unit` with a stronger height cap, so low browser
  windows fit without scrolling; SETTINGS shrinks its rows and gaps with the height instead. The stage sets the six
  game colors as CSS variables (`--red` … `--cyan`); components use them, or `COLOR_CSS` from `src/core/colors.ts`
  where they need the value in script, never hex values of their own, so every screen and the icon
  (`public/favicon.svg`, which has to be updated by hand) show exactly the game's colors. The stage's `--accent`
  (`--yellow`, `--red` while a hardcore game runs) colors the highlights of every screen a game shows.
- `public/` – PWA files copied as-is: `manifest.webmanifest`, icons (the PNGs and `favicon.ico` are renders of
  `favicon.svg`, re-render them when it changes) and `sw.js`, a plain JS service worker (network first for the page,
  cache first for files). `main.ts` registers it in production builds only and reports the loaded files, so the cache
  holds exactly the current version. `src/platform/install.svelte.ts` keeps the browser's install offer for the menu's
  INSTALL button.
- The tutorial is `src/core/tutorial.ts`, the intro cards come from the definitions (`src/core/intros.ts`); `Session`
  runs both. A card's example is a challenge of its group drawn by `WordView` (`introExample` builds it from the
  definition's `demo`: loops, a time limit, variants in turn, presses) or the group's sign alone (`example: "sign"`).
- Awards are defined in `src/core/awards.ts` (the modifier awards from the definitions, one per group with its id);
  `src/core/stats.ts` counts cleared levels per award, is saved after every cleared level and reports newly unlocked
  awards (toast in game, list on game over).
- Modifiers belong to groups (all mirrors are one group) with a tier (easy, medium, hard: the intro order and the
  group's extra time).
  Groups that must not share a level name each other in `conflictsWith` (only one of them needs to), and a level
  has at most one `rule` group. With Symmetry the mirror group only turns the word upside down.
  `src/core/progression.ts` holds the per-game curriculum (`PlayingState.curriculum`: a new group every 3 levels from
  level 5, alone on its intro level; an intro due on a surge level moves to the level after it), the per-level pick
  (`maxGroupCount` grows by one every 12 levels; from level 40 to 80 plain levels die out and the count's weights move
  from mostly one to every count equally likely), surge levels (`isSurgeLevel`,
  announced by the `surgeBanner` phase; `surgeGroupCount` grows by one per surge, the time is a fixed
  `SURGE_TIME_MS`; all these numbers are in `balance.ts`), the time limit (a base that bends from 3 s at level 1 to 1 s at level 80, every group adds
  `EXTRA_TIME_MS` of its tier and its own `extraTimeMs` (DUO) on top, on a surge too, and a rule's `timeShare`
  shortens all of it: Don't Click levels are only sat out) and the tempo of animated modifiers
  (`tempoFor`, following the shrinking base up to `MAX_TEMPO` (1.5) at level 80, stored in `Challenge.tempo`, applied in
  `wordFrame.ts`), and along with the tempo
  the strength (`strengthFor`, `Challenge.strength`, 0 on the intro level to 1 from level 80) that makes rotation
  uneven, widens pulse and shake, blurs more and picks the `wild` Font Flip fonts more often; at strength 1 every such
  effect is at most 1.5 times what it is at 0.

## Conventions

- Keep game rules out of components; add them to `src/core/` with a colocated `*.test.ts`.
- Docs for players and setup are in `README.md` (German); code, comments and this file are English.
- Look: "Classic Arcade" (black, pixel font, scanlines, hard edges), dark only. Approved design prototypes:
  https://claude.ai/artifact/VKJWcc8fSgcsMTnLPURYGH (page "2 · Arcade details"). Sizes use `--unit` (1 % of the
  width, capped) with a px minimum for phones. No text below 10 px (`--text-tiny`), card and button text at least
  11 px (`--text-small`); text that may wrap needs a `line-height` (the pixel font's default is too tight). Screens
  build on `src/ui/kit/` and take grays, frames and fixed text sizes from `tokens.css`, never hex grays of their own.
- `e2e/` – browser tests that play the game like a player: they find things by role, label and text, and read the
  word's answer from its text and `data-ink`, never from CSS classes or component internals. Keep those stable, or
  change the helpers in `e2e/helpers.ts` with them. The e2e build and the dev server take a fixed random seed from the
  URL (`?seed=42`, `src/platform/testRng.ts`), so a game can be played again exactly; production builds leave that out.
  They also have the modifier gallery (`?gallery`, `src/ui/dev/Gallery.svelte`, mounted by `main.ts`): every group,
  or a combination (`?gallery=moving,shaky`), drawn by `WordView`, `&t=500` freezes the time, `&level=80` sets tempo
  and strength, `&colorblind`, `&intro=rotation` shows the intro card.
- `vite.config.ts` uses `base: "./"` so the build works under the `/ColorMatch/` Pages path.
