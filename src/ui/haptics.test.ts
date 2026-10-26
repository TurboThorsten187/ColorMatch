import { describe, expect, it } from "vitest";
import { vibrationFor } from "./haptics.ts";

describe("vibrations", () => {
    it("grow from a SPAM! tap to a missed practice word to a lost game", () => {
        expect(vibrationFor({ kind: "spamTap", count: 2 })).toBe("light");
        expect(vibrationFor({ kind: "miss" })).toBe("medium");
        expect(vibrationFor({ kind: "lost", reason: "timeout", newRecord: false })).toBe("heavy");
    });

    it("leave everything else to the sounds", () => {
        for (const kind of ["click", "hit", "surge", "intro", "lowTime", "award"] as const) {
            expect(vibrationFor({ kind })).toBeNull();
        }
    });
});
