// The pixel icons at both ends of a rule sign, so a rule is told apart without reading it. Rows of 7 x 7 pixels,
// # is a pixel.
export interface PixelIcon {
    readonly rows: readonly string[];
    // Points somewhere: the copy at the end of a sign is mirrored, so both face the text
    readonly directed: boolean;
}

export type RuleIconId = "noClick" | "invertInput" | "wait" | "now" | "doubleTap" | "twoWords";

export const ICON_SIZE = 7;

export const RULE_ICONS: Readonly<Record<RuleIconId, PixelIcon>> = {
    // A cross
    noClick: { rows: ["##...##", "###.###", ".#####.", "..###..", ".#####.", "###.###", "##...##"], directed: false },
    // Two arrows, one to the right and one to the left
    invertInput: {
        rows: [".....#.", "..#####", ".....#.", ".......", ".#.....", "#####..", ".#....."],
        directed: false,
    },
    // Pause, and play once the sign says NOW
    wait: { rows: [".......", ".##.##.", ".##.##.", ".##.##.", ".##.##.", ".##.##.", "......."], directed: false },
    now: { rows: ["#......", "##.....", "###....", "####...", "###....", "##.....", "#......"], directed: true },
    // Two dots, one per tap
    doubleTap: { rows: [".......", ".......", "###.###", "###.###", "###.###", ".......", "......."], directed: false },
    // An equals sign: both words alike
    twoWords: { rows: [".......", "#######", "#######", ".......", "#######", "#######", "......."], directed: false },
};

// The pixels of an icon as x / y pairs
export function pixelsOf(icon: PixelIcon): { readonly x: number; readonly y: number }[] {
    return icon.rows.flatMap((row, y) => [...row].flatMap((pixel, x) => (pixel === "#" ? [{ x, y }] : [])));
}
