---
paths:
  - "src/modifiers/**"
  - "src/ui/word/**"
---

# Modifiers (src/modifiers)

The checklist for a new modifier is in CLAUDE.md ("Adding a modifier").

- A group (`ModifierGroup` in `types.ts`, all mirrors are one group) has a tier (easy, medium, hard: the intro order
  and its extra time) and variants; a level gets one variant of each of its groups.
- `conflictsWith`: groups that must not share a level (only one of two needs to name the other). Two rule groups never
  meet anyway. With Symmetry the mirror group only turns the word upside down (`pickVariant`).
- `hidesShapes`: the colorblind shapes are about as wide as the letters' strokes on phones, so groups that blur,
  shrink or shake them are left out of colorblind games; Font Flip only uses the `thick` fonts there.
- `rule` changes what solves a level: `expect` (the input asked for), `presses` (DOUBLE TAP, SPAM!), `lockedShare`
  (WAIT: a press before it is a miss), `timeShare` (Don't Click). A rule group shows a `sign` above the word: text and a
  7 × 7 `PixelIcon` at both ends (a `directed` icon is mirrored at the end, so both face the text); SPAM! has none.
- Hooks: `pickVariant`, `words` (changes the words: DUO's second one), `decorate` (what depends on the final words,
  like a background in neither ink), `extraTimeMs`.
- `intro`: title, lines (`*marked*` words in the accent; `colorblindLines`, `flippedLines` where they name colors or a
  side), the `example` (a color word, or `"sign"` for the rule sign alone) and its `demo` (`loopMs`, `timeLimitMs`,
  `variantMs`, `pressMs`, challenge fields), played by `introExample` in `src/core/intros.ts`.
- `award`: badge code (two characters, unique), name, the levels it counts.
- Numbers of one modifier alone stay in its folder (`WAIT_SHARE`, `SPAM_PRESSES_NEEDED`, `DUO_EXTRA_MS`, the Zoom
  sizes …); shared tuning is in `src/core/balance.ts`.
- `look.ts`: how the modifier looks, as pure functions of the level's seed, the time it `played` (elapsed time at its
  tempo) and its strength, so it stands still while paused and looks the same after resuming. Random-looking motion
  uses `noise` from `src/modifiers/look.ts`. Everything that grows with the strength is at most 1.5 times at strength 1
  what it is at 0 (rotation turns unevenly, pulse and shake widen, blur grows, wild Font Flip fonts come more often).
  `src/ui/word/wordFrame.ts` combines the looks: it may know how they interact (a moving word keeps the shake's reach
  from the sides, a pulsing one its largest size; the afterimage offset and the shake shrink with Zoom).
- Definitions import only types from `src/core` (plus `colors.ts`, `random.ts`); ESLint enforces it.
- `registry.test.ts` checks every definition: unique ids and badge codes, valid conflicts, an intro and an award for
  each, signs exactly on the rule groups.
