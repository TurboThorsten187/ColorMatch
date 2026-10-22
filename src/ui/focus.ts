import { type Direction, neighbor } from "@/app/spatialNav.ts";

// The selection: outside of a level the arrow keys, WASD and a moved mouse select a button of the screen, which the
// stage colors while keys are used (its `keys` class)

// What the selection can land on; the volume buttons are left out because the volume bar takes left and right
const NAVIGABLE = 'button:not(:disabled):not([tabindex="-1"]), [role="slider"]';
// A pressed button gives way this long before it acts
const BUTTON_PRESS_MS = 120;

// Moves the focus inside `stage` to the nearest button in `direction`. While the selection is hidden (mouse or touch
// were used) the first key only shows it. Returns whether the focus moved.
export function moveFocus(stage: HTMLElement, direction: Direction, shown: boolean): boolean {
    const items = [...stage.querySelectorAll<HTMLElement>(NAVIGABLE)].filter(
        (item) => item.getClientRects().length > 0,
    );
    const current = items.findIndex((item) => item === document.activeElement);
    if (current >= 0 && !shown) return false;
    const next =
        current < 0
            ? 0
            : neighbor(
                  items.map((item) => item.getBoundingClientRect()),
                  current,
                  direction,
              );
    const target = next === null ? undefined : items[next];
    if (!target) return false;
    target.focus();
    return true;
}

// With a mouse the button under it is selected like with the keys, and the arrow keys go on from there. Only a
// moved mouse counts: a new screen appearing under a resting one must not take the selection away from the keys.
// Returns whether a button is selected now.
export function focusHovered(event: PointerEvent, stage: HTMLElement): boolean {
    if (event.pointerType !== "mouse" || (event.movementX === 0 && event.movementY === 0)) return false;
    if (!(event.target instanceof Element)) return false;
    const item = event.target.closest<HTMLElement>(NAVIGABLE);
    if (!item || !stage.contains(item)) return false;
    if (item !== document.activeElement) item.focus({ preventScroll: true });
    return true;
}

// Set while a held back click is replayed, so it is not held back again
let replaying = false;

// A press of a button, by tap, click, Enter or Space, is held back until the button has given way (its `data-press`
// state), so the press can be seen even when the screen changes right after. Buttons with their own press feedback
// opt out with data-no-press. For the stage's click capture.
export function holdPress(event: MouseEvent): void {
    if (replaying || !(event.target instanceof Element)) return;
    const button = event.target.closest("button");
    if (!button || button.dataset.noPress !== undefined) return;
    event.stopPropagation();
    if (button.dataset.press !== undefined) return;
    button.dataset.press = "";
    setTimeout(() => {
        delete button.dataset.press;
        if (!button.isConnected || button.disabled) return;
        replaying = true;
        try {
            button.click();
        } finally {
            replaying = false;
        }
    }, BUTTON_PRESS_MS);
}
