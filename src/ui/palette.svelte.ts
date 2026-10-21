import { type Color, COLOR_CSS, OLD_COLOR_CSS } from "../game/colors.ts";
import type { Settings } from "../game/settings.ts";

// The palette every screen paints with. It follows the OLD COLORS setting like the sound follows its settings, so the
// screens need no extra prop for a switch that only exists while the design is reworked.

let oldColors = $state(false);

export function configurePalette(settings: Settings): void {
    oldColors = settings.oldColors;
}

// The CSS value of `color`; read inside a template or $derived, the screen repaints when the setting changes
export function inkCss(color: Color): string {
    return (oldColors ? OLD_COLOR_CSS : COLOR_CSS)[color];
}
