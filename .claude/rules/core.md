---
paths:
  - "src/core/**"
  - "src/app/**"
---

# Game logic (src/core, src/app)

- Pure: no DOM, no Svelte, no storage. Transitions take `now` (ms) and an injected `Rng` and return a new immutable
  state; tests build states with `testChallenge.ts` and seeded rngs (`seededRng`).
- `game.ts`: the `GameState` union (menu, playing, spam pause, surge banner, paused, game over) and its transitions.
  Every running state carries its `Mode` (`normal` or `hardcore`, `modeOf`); RETRY keeps it. A lost game keeps how
  (`GameOverState.reason`: miss, early, timeout) and the level (`lost`). The spam pause starts with `SPAM_BANG_MS` of
  the solved SPAM! (`isSpamBang`), drawn from `SpamPauseState.solved` at `solvedAt`. `isTooEarly` uses the
  challenge's `lockedShare`, `answer` its `presses`.
- `events.ts`: `gameEvents(previous, next, now)` says what happened (started, cleared with the reaction time,
  spamTap, surge, levelBegan, lost, resumed, menu), so nothing outside of core compares states.
- `challenge.ts`: `createChallenge` builds a level from its groups' definitions: one variant each (`pickVariant` or
  any), the rule group's `expect`/`presses`/`lockedShare`, then the `words` hooks (DUO's second word) and the
  `decorate` hooks (background, rotation start, Zoom size). `Challenge.groups` is in registry order.
- `progression.ts` (numbers in `balance.ts`):
  - Curriculum per game (`PlayingState.curriculum`): a new group every 3 levels from level 5, easy before medium
    before hard, alone on its intro level; an intro due on a surge level moves to the level after it. A colorblind
    game leaves out the `hidesShapes` groups (`startGame`/`confirm` take the setting).
  - Per level: `maxGroupCount` grows by one every 12 levels; from level 40 to 80 plain levels die out and the count's
    weights move from mostly one to every count equally likely. Conflicting groups (`conflicts`) never meet, a level has
    at most one rule group.
  - Surges (`isSurgeLevel`, announced by the `surgeBanner` phase): `surgeGroupCount` grows by one per surge, the time
    is a fixed `SURGE_TIME_MS`.
  - `timeLimitFor`: a base that bends from 3 s at level 1 to 1 s at level 80, plus `INTRO_BONUS_MS` on an intro level,
    plus `EXTRA_TIME_MS` of every group's tier and its own `extraTimeMs` (on a surge too), all times the rule's
    `timeShare` (Don't Click levels are only sat out).
  - `tempoFor`: animated modifiers speed up with the shrinking base, from 1 on their intro level to `MAX_TEMPO` (1.5)
    at level 80 (`Challenge.tempo`); `strengthFor` goes from 0 to 1 along with it (`Challenge.strength`).
  - Hardcore is `mode` branches here: no intros, base time 1 s, full tempo/strength/zoom, a new count every 3 levels,
    no plain levels, surges from `HARDCORE_SURGE_FIRST_LEVEL`. It opens at `HARDCORE_UNLOCK_SCORE` and keeps its own
    highscore (`Highscores` in `highscore.ts`); a hardcore game records no stats and no awards.
- `intros.ts`: the cards come from the definitions; `newIntros` picks the unseen ones of a level, `introExample` plays a
  card's example from its `demo`. `tutorial.ts` runs beside the game state, which stays in the menu meanwhile.
- `awards.ts` (milestones, surge, one per modifier group in `MODIFIER_AWARD_ORDER`) and `stats.ts` (cleared levels per
  award, saved after every cleared level, reports newly unlocked awards).
- `save.ts`: everything kept between visits is one `SaveData` (settings, highscores, stats, tutorial progress), one
  JSON object with `SAVE_VERSION` under one key (`src/platform/storage.ts`). Each part has a pure `parse…` in its
  module that reads stored JSON field by field, every invalid field falling back on its own. A format change older saves
  cannot be read with bumps `SAVE_VERSION`, and `parseSave` converts the older versions or they start over.
  `writeSave` never lowers a highscore (another tab may have saved a better one); `removeOldSaves` deletes the keys of
  the format before version 1.
- `src/app/session.svelte.ts`: a level whose `levelBegan` shows a modifier never seen before stays paused until its
  cards are confirmed; `#changeSave` writes all of the save on every change, `reload` takes over what another tab
  saved. Inputs: `side`, `tap`, `enter`, `back`, `answers`, `atMenu` (back has nowhere to go); `answerOn` in `settings.ts` maps a screen half or key to an
  answer, because FLIP CONTROLS swaps them. `keys.ts` maps keys, `spatialNav.ts` finds the button in a direction,
  `toastQueue.ts` times the award toasts.
