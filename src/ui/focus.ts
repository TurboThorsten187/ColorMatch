import { type Direction, neighbor } from "@/app/spatialNav.ts";

// The selection: outside of a level the arrow keys, WASD and a moved mouse select a button of the screen, which the
// stage colors while keys are used (its `keys` class)

// What the selection can land on; the volume buttons are left out because the volume bar takes left and right
const NAVIGABLE = 'button:not(:disabled):not([tabindex="-1"]), [role="slider"]';

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
