---
paths:
  - "src/ui/**"
  - "src/App.svelte"
  - "src/main.ts"
---

# Screens and look (src/ui)

- Look: "Classic Arcade" (black, pixel font, scanlines, hard edges), dark only. Approved design prototypes:
  https://claude.ai/artifact/VKJWcc8fSgcsMTnLPURYGH (page "2 · Arcade details"). Sizes use `--unit` (1 % of the
  width, capped) with a px minimum for phones. No text below 10 px (`--text-tiny`), card and button text at least
  11 px (`--text-small`); text that may wrap needs a `line-height` (the pixel font's default is too tight). Grays,
  frames and fixed text sizes come from `src/ui/kit/tokens.css`, never hex grays of their own. Buttons have no shadows.
- Colors: the stage sets the six game colors as CSS variables (`--red` … `--cyan`); components use them, or
  `COLOR_CSS` from `src/core/colors.ts` in script, never hex values of their own, so every screen and the icon
  (`public/favicon.svg` and the Android icon vectors in `android/app/src/main/res/`, updated by hand) show exactly the
  game's colors. `--accent` (`--yellow`, `--red` while a
  hardcore game runs) colors the highlights of every screen a game shows.
- Kit (`src/ui/kit/`): `Button` (`small` 44 px or `large` 56 px, `square`, `color` to be selected in, `ink`/`line` for
  colored text and frame) gives way for `PRESS_MS` (its `data-press` state, which the stage colors and shrinks) before
  it acts, so the press shows even when the screen changes; `instant` buttons (`Toggle`, the `Slider` steps) act at
  once and only show it. `Screen` is a whole screen inside the safe area with `--key-help-room` free at the bottom
  (`scroll`, `narrow` for the 460 px column; its child fills the height). `ScreenHead` is ◄ and a title, `Card` the
  framed card of the tutorial and the modifier cards. Screens size them with CSS variables on a surrounding element
  (`--button-height`, `--button-width`, `--button-flex`, `--button-font`, `--button-padding`, `--card-gap`,
  `--card-padding`), never by styling their insides. HOLD TO RESET and the award badges are plain buttons.
- Keyboard and focus: outside of a level arrow keys and WASD move the focus between buttons by position (`moveFocus`
  in `src/ui/focus.ts`), a moved mouse focuses the button under it (`focusHovered`). The selection only shows while
  keyboard mode puts the `keys` class on the stage, together with the `key-help` strip, for which every screen with
  buttons keeps `--key-help-room` free (0 on short screens, which hide the strip). `Stage`'s global button CSS colors
  border and text of the selected and of the pressed button in its `--button-color` (the accent without one) and
  shrinks a pressed one a little. Every screen that names a side takes
  a `flipControls` prop, every screen that shows a color word a `colorblind` prop.
- Screens: `LevelScreen` is a running level (also the solved SPAM! frozen at its last press), `LossScreen` plays the
  loss animation (`screens/lossAnimation.ts`, driven by the time since the loss) before `GameOverScreen`. Menu and game
  over redefine `--unit` with a stronger height cap, so low windows fit without scrolling; SETTINGS shrinks its rows
  and gaps with the height. `hud/`: `TopBar` (level and highscore over a 24-block timer; the modifier cards reuse it
  `inline` and `paused`), `TapHints`, `FeedbackFlash`, `AwardToast`, `AwardBadge`, `lowTimeGlow.ts`.
- The word (`src/ui/word/`): one pipeline draws it in a level, the tutorial, the loss animation and on the intro
  cards. `wordFrame()` turns a challenge, the time and a box with its `Layout` (`STAGE`, or `CARD` for an intro card's
  example box) into a `WordFrame` (lines and letters, font size, the anchor's transform, opacity, blur, signs,
  afterimage), using the modifiers' `look.ts`; it is pure apart from measuring text (`fitText.ts`, `fontFlip.ts`) and
  unit tested. `WordView` renders it: every transform pivots around a zero-size anchor in the box's middle; the rule
  signs (`RuleSign`, icons via `pixelIcon.ts`) sit in the anchor and get every effect too. A word is one text, or
  letter by letter for Font Flip, Assemble and SPAM!, inside `SplitMirror` (rendered twice) for Symmetry; the Negative
  afterimage reuses it. Only the leaves carry `data-ink` (the plain word, a Symmetry half of plain text, or each
  letter), never their wrappers: the loss animation rasterizes the anchor's first child, every `data-ink` piece with
  its font, ink and transforms, cut at the middle of its closest `data-left-half`, and the e2e tests read it.
- Negative inverts `LevelScreen`'s `.playfield` (level, timer, hints) while `isNegative`, an intro card its example
  box; the low time frame (from `LOW_TIME_SHARE` of real time left, also on Count Up) lies outside of it so it stays
  red.
- Colorblind: the six colors stay internally, each shows as a shape: `SHAPE_WORDS`/`wordFor` in `src/core/colors.ts`
  give the words, `word/shapes.ts` fills the letters (`inkStyle`) and the background (`backgroundStyle`) with SVG
  shape tiles.
- Sound: `sounds.ts` turns `SessionEvent`s into cues timed to the screens (`cuesFor`); `src/platform/sound.ts` wraps
  Web Audio, `unlockAudio()` runs on every input (browsers need a gesture; on touch only `pointerup` counts), each
  sound is built from oscillators when it plays.
- Vibration: `haptics.ts` maps `SessionEvent`s to a strength (`vibrationFor`: SPAM! tap light, practice miss medium,
  loss heavy, nothing else); `src/platform/haptics.ts` plays it through `@capacitor/haptics` (the app's vibrator,
  `navigator.vibrate` in a phone browser). `canVibrate()` (the app, or a touch screen with the Vibration API) decides
  whether SETTINGS shows VIBRATION; the e2e tests run on a desktop, where it is hidden.
- The modifier gallery (`src/ui/dev/Gallery.svelte`, dev server and e2e builds only, mounted by `main.ts` for
  `?gallery`): every group, or a combination (`?gallery=moving,shaky`), drawn by `WordView`; `&t=500` freezes the
  time, `&level=80` sets tempo and strength, `&colorblind`, `&intro=rotation` shows the intro card.
