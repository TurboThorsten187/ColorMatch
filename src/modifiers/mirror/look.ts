import type { Point } from "@/modifiers/look.ts";
import type { ModifierId } from "@/modifiers/types.ts";

// The word's scale for its mirrors: -1 flips it left to right (x) or upside down (y)
export function mirrorScale(modifiers: ReadonlySet<ModifierId>): Point {
    return {
        x: modifiers.has("mirrorHorizontal") || modifiers.has("mirrorBoth") ? -1 : 1,
        y: modifiers.has("mirrorVertical") || modifiers.has("mirrorBoth") ? -1 : 1,
    };
}
