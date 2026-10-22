---
paths:
  - "e2e/**"
  - "playwright.config.ts"
---

# Browser tests (e2e)

- They play the game like a player: find things by role, label and text, and read the word's answer from its text and
  `data-ink`, never from CSS classes or component internals. Keep those stable, or change the helpers in
  `e2e/helpers.ts` with them.
- They run against `npm run build:e2e` (a production build in the e2e mode, served by `vite preview`), with the
  service worker. The e2e build and the dev server take a fixed random seed from the URL (`?seed=42`,
  `src/platform/testRng.ts`), so a game can be played again exactly; production builds leave that out.
- Timing a player would not notice matters here: a pressed `Button` acts after `PRESS_MS` (120 ms), taps right after
  leaving a card are ignored for `CARD_INPUT_LOCK_MS`; wait for what the screen shows, not for a fixed time.
- No retries: a test that fails now and then has a bug to find.
