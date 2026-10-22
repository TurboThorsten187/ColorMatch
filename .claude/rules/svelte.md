---
paths:
  - "**/*.svelte"
  - "**/*.svelte.ts"
---

# Svelte 5 in this project

- Runes only (`$state`, `$derived`, `$effect`, `$props`); no legacy `export let`, `$:` or stores.
- Event attributes (`onclick`, `onkeydown`), not `on:` directives; snippets (`{@render children()}`), not slots.
- Immutable objects from `src/core/` go into `$state.raw`, they are replaced, never mutated.
- Typed props: an `interface Props` plus `let { ... }: Props = $props();`.
- `$effect` only for side effects with cleanup (timers, rAF, listeners); derive values with `$derived`.
- Svelte collapses whitespace in markup: put strings with meaningful spacing into a `{constant}`.
- `npm run typecheck` runs svelte-check with `--fail-on-warnings`, so a11y warnings fail CI too.
- Buttons are `@/ui/kit/Button.svelte`, whole screens `Screen`, cards `Card` (see `ui.md`, `src/ui/kit/`). Size them
  with their CSS variables on a surrounding element, never with `:global` styles on their insides.
