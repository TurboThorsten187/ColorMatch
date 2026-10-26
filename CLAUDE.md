# ColorMatch

Browser reaction game (Stroop effect): does the word match its ink color? Deployed to GitHub Pages
(https://turbothorsten187.github.io/ColorMatch/) by `.github/workflows/deploy.yml` on every push to `main`, once
`npm run check` and the e2e tests pass.

More detail for an area loads with its files from `.claude/rules/`: `core.md` (game logic, progression, save),
`modifiers.md` (modifier definitions and looks), `ui.md` (screens, kit, word rendering, look), `svelte.md` (Svelte 5
idioms) and `e2e.md` (browser tests).

## Stack

Svelte 5 (runes) + TypeScript, Vite 8, Vitest, Playwright, ESLint (flat config) + Prettier, vite-plugin-pwa with
Workbox. Runtime dependencies besides Svelte: self-hosted fonts via `@fontsource` (Press Start 2P for the UI,
Orbitron 900 for the color word, plus 26 display fonts for the Font Flip modifier, `FLIP_FONTS` in
`src/platform/fonts.ts`; latin subsets only). Sounds are chiptune sounds synthesized with Web Audio oscillators
(`src/platform/synth.ts`), there are no audio files. Capacitor 8 wraps the same production build as the Android app
(`android/`, `capacitor.config.ts`, app id `io.github.turbothorsten187.colormatch`, fixed for good once in the Play
Store).

## Commands

- `npm run dev` – dev server; `?seed=42` plays a fixed game, `?gallery` shows every modifier (see `ui.md`)
- `npm run check` – lint, typecheck (svelte-check, `tsc -p e2e`, `tsc -p tsconfig.sw.json`), unit tests, build; run
  before every commit
- `npm run test:e2e` – Playwright browser tests (`e2e/`) against `npm run build:e2e`; run them too when a change
  touches the UI, `App.svelte` or the service worker. They need a Chromium: `npx playwright install chromium`, or
  `CHROMIUM_PATH` pointing to an installed one (in Claude Code cloud sessions `CHROMIUM_PATH=/opt/pw-browsers/chromium`)
- `npm run format` – Prettier (4 spaces, 120 columns)
- `npm run android:sync` – build and copy into `android/`; `android:open` (Android Studio), `android:run` (device or
  emulator). Gradle needs `JAVA_HOME` on a JDK 21 and `ANDROID_HOME` on the SDK.

## Architecture

```
src/ui/  ──►  src/app/  ──►  src/core/  ──►  src/modifiers/
  (Svelte)     (Session)      (pure rules)    (one folder per modifier group)
                  │
            src/platform/  (the browser and the app: storage, sound, vibration, fonts, install, test seed)
```

Imports go one way along the arrows; `ui` may also use `platform`, `core` and `modifiers` directly. Modifier
definitions take only types from `core` (and its leaf modules `colors.ts`, `random.ts`), so nothing depends on itself
when the game loads. Across folders imports start at `src/` (`@/core/game.ts`), within a folder they are relative
(`./game.ts`); ESLint's `no-restricted-imports` blocks every other direction and `../` paths (`eslint.config.js`).

- `src/core/` – the game as pure functions: the immutable `GameState` and its transitions (`answer`, `confirm`,
  `toMenu`, `tick`, `pause`, `resume`) take the time and an injected `Rng`; `events.ts` turns a transition into what
  happened (`gameEvents`). Progression, time limits, awards, stats, tutorial, intro cards and the save format live here
  too. Every rule is unit tested.
- `src/modifiers/` – every modifier group in a folder of its own: its definition (tier, conflicts, how it changes the
  rules, its sign, intro card and award) and its `look.ts`. `registry.ts` lists them; `core` and `ui` read everything
  about a modifier from there and name none of them in their logic.
- `src/app/session.svelte.ts` – `Session`, the only stateful place: game state and clock, tutorial, intro cards,
  settings/stats views, the save, stats and award toasts, and what each input means on each screen. It reports
  `SessionEvent`s (what to play); storage, random numbers, the clock and listeners are passed in, so it is tested
  without a browser.
- `src/ui/` – Svelte: `Stage.svelte` (the frame and the game colors), `Screens.svelte` (picks the screen for the
  session), `screens/`, `hud/`, `word/` (draws the color word), `kit/` (buttons, cards, screens, `tokens.css`),
  `sounds.ts` (`SessionEvent`s to sounds), `haptics.ts` (`SessionEvent`s to vibrations), `dev/` (the modifier
  gallery).
- `src/App.svelte` – the browser side: creates the `Session` (with `localStorage`, `performance.now`, the URL seed,
  `playEvent`, `configureSound`), runs the rAF loop and turns keys, pointer, `blur`/`visibilitychange` and `storage`
  events into session calls.
- `src/main.ts` – awaits the UI and word fonts (the word is fitted by measuring them), mounts `App` (or the gallery),
  loads the Font Flip fonts in the background and registers the service worker in web builds (not in the app).
- `src/platform/native.ts` – `isNativeApp()`: the app is told apart at runtime (`Capacitor.isNativePlatform()`), never
  by a Vite mode, because every mode but `production` ships the gallery and the test seed. `listenToApp` brings
  Android's back button (App.svelte: `session.back()`, or `minimizeApp()` while `session.atMenu`) and the app going to
  the background (`session.leave()`); in the web version it does nothing.
- `android/` – the native frame: `MainActivity` keeps the system bars hidden (a swipe shows them for a moment), the
  launch theme is black. The icon is vector drawables that repeat `public/favicon.svg` (`drawable/ic_launcher_foreground.xml`
  for adaptive icons, `mipmap-anydpi/` for Android 7); change them with it. The save stays in the WebView's
  `localStorage`, which Android's Auto Backup includes.
- `src/sw.ts` + `vite.config.ts` – installable and offline (PWA): vite-plugin-pwa writes the manifest, renders the
  icons from `public/favicon.svg` on every build and builds the Workbox worker, which precaches every file of the
  build (all fonts included). The page comes from the network while online, so a new version shows at once; offline
  it is the precached one. `e2e/offline.spec.ts` plays offline.

## Adding a modifier

1. Add its id to `ModifierId` and, for a new group, `ModifierGroupId` in `src/modifiers/types.ts`.
2. Create `src/modifiers/<id>/<id>.ts` with its `ModifierGroup`: tier, variants, `conflictsWith`, `hidesShapes` if it
   blurs, shrinks or shakes the colorblind shapes away, a `rule` (and `sign`) if it changes what solves a level, the
   hooks it needs (`words`, `decorate`, `pickVariant`, `extraTimeMs`), the intro card with its `demo`, the award.
3. List it in `GROUPS` in `src/modifiers/registry.ts` and in `MODIFIER_AWARD_ORDER` in `src/core/awards.ts`.
4. If it changes how the word looks: pure functions in `src/modifiers/<id>/look.ts` (seed, time `played`, strength),
   tested in `look.test.ts`, and their use in `src/ui/word/wordFrame.ts`.
5. Look at it in `?gallery` (alone, combined, `&level=80`, `&colorblind`, `&intro=<id>`); `npm run check` runs the
   registry's completeness tests.

A new kind of rule may need a new field in `Rule` or a new hook, handled generically in `core`.

## Conventions

- Game rules belong in `src/core/` (or a modifier definition) with a colocated `*.test.ts`, never in components.
- The numbers that tune difficulty are in `src/core/balance.ts`, except those of a single modifier, which stay in its
  folder.
- Shown names may differ from the ids, which stay for saved stats: `blink` is FADE, `splitMirror` SYMMETRY,
  `countUp` REVERSE TIMER, `twoWords` DUO.
- Code, comments and these docs are English; `README.md` (players and setup) is German.
- `vite.config.ts` uses `base: "./"` so the build works under the `/ColorMatch/` Pages path.
