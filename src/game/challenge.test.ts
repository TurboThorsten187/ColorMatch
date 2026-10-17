import { describe, expect, it } from "vitest";
import { createChallenge, expectedInput } from "./challenge.ts";
import type { ModifierId } from "./modifiers.ts";

const set = (...ids: ModifierId[]): ReadonlySet<ModifierId> => new Set(ids);

describe("expectedInput", () => {
    it("keeps the answer without logic modifiers", () => {
        expect(expectedInput("true", set("blur"))).toBe("true");
        expect(expectedInput("false", set())).toBe("false");
    });

    it("inverts the answer", () => {
        expect(expectedInput("true", set("invertInput"))).toBe("false");
        expect(expectedInput("false", set("invertInput"))).toBe("true");
    });

    it("expects no input for noClick and repeated presses for spam", () => {
        expect(expectedInput("true", set("noClick"))).toBe("none");
        expect(expectedInput("false", set("spam"))).toBe("spam");
    });
});

describe("createChallenge", () => {
    it("expects true exactly when the word names its own color", () => {
        for (let run = 0; run < 500; run++) {
            const challenge = createChallenge(1, Math.random);

            expect(challenge.modifiers.size).toBe(0);
            expect(challenge.expected).toBe(challenge.word === challenge.color ? "true" : "false");
        }
    });

    it("only sets background and rotation with their modifiers", () => {
        for (let run = 0; run < 2000; run++) {
            const challenge = createChallenge(40, Math.random);

            expect(challenge.background !== null).toBe(challenge.modifiers.has("background"));
            if (challenge.background !== null) {
                expect(challenge.background).not.toBe(challenge.color);
            }
            if (!challenge.modifiers.has("rotation")) {
                expect(challenge.rotationDeg).toBe(0);
            }
            expect(Math.abs(challenge.rotationDeg)).toBeLessThanOrEqual(90);
        }
    });
});
