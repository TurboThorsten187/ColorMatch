import type { ModifierGroup, PixelIcon } from "@/modifiers/types.ts";

// A Don't Click level is only sat out, the full time would just be waiting
export const NO_CLICK_TIME_SHARE = 0.6;

const CROSS: PixelIcon = {
    rows: ["##...##", "###.###", ".#####.", "..###..", ".#####.", "###.###", "##...##"],
    directed: false,
};

// Hands off: pressing anything loses the level, waiting until the time runs out solves it
export const noClick: ModifierGroup = {
    id: "noClick",
    tier: "medium",
    variants: ["noClick"],
    rule: { expect: () => "none", timeShare: NO_CLICK_TIME_SHARE },
    sign: () => ({ text: "DON'T CLICK", icon: CROSS }),
    intro: {
        title: "DON'T CLICK",
        example: { text: "DON'T CLICK", color: "red" },
        lines: ["HANDS *OFF*!", "WAIT UNTIL", "THE TIMER RUNS OUT"],
        accent: "red",
    },
    award: { code: "NC", name: "HANDS OFF", levels: "DON'T CLICK", verb: "SIT OUT" },
};
