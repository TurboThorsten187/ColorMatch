import type { PixelIcon } from "@/modifiers/types.ts";

// The pixel icons of the rule signs are part of their modifier definitions; this draws them

export const ICON_SIZE = 7;

// The pixels of an icon as x / y pairs
export function pixelsOf(icon: PixelIcon): { readonly x: number; readonly y: number }[] {
    return icon.rows.flatMap((row, y) => [...row].flatMap((pixel, x) => (pixel === "#" ? [{ x, y }] : [])));
}
