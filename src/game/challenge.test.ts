import { describe, expect, it } from "vitest";
import { createChallenge, expectedInput } from "./challenge.ts";
import { MODIFIER_GROUPS, type ModifierId } from "./modifiers.ts";

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
            const challenge = createChallenge([], 1, Math.random);

            expect(challenge.modifiers.size).toBe(0);
            expect(challenge.expected).toBe(challenge.word === challenge.color ? "true" : "false");
        }
    });

    it("uses one modifier of every picked group", () => {
        for (let run = 0; run < 200; run++) {
            const challenge = createChallenge(["mirror", "blur", "spam"], 20, Math.random);

            expect(challenge.modifiers.size).toBe(3);
            const mirrors = (["mirrorVertical", "mirrorHorizontal", "mirrorBoth"] as const).filter((id) =>
                challenge.modifiers.has(id),
            );
            expect(mirrors).toHaveLength(1);
            expect(challenge.expected).toBe("spam");
            expect(challenge.seed).toBeGreaterThanOrEqual(0);
            expect(challenge.seed).toBeLessThan(1);
        }
    });

    it("only sets background and rotation with their modifiers", () => {
        const groups = MODIFIER_GROUPS.map((group) => group.id);
        for (let run = 0; run < 2000; run++) {
            const challenge = createChallenge(
                groups.filter(() => Math.random() < 0.3),
                40,
                Math.random,
            );

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

    it("does not give the answer away with the background", () => {
        let falses = 0;
        let lures = 0;
        for (let run = 0; run < 3000; run++) {
            const challenge = createChallenge(["background"], 20, Math.random);
            if (challenge.expected === "false") {
                falses++;
                if (challenge.background === challenge.word) lures++;
            }
        }

        // A background in the named color must not mean FALSE every time
        expect(lures).toBeGreaterThan(0);
        expect(lures / falses).toBeLessThan(0.4);
    });

    it("keeps the background off the inks of both words", () => {
        for (let run = 0; run < 500; run++) {
            const challenge = createChallenge(["background", "twoWords"], 20, Math.random);
            if (!challenge.second) throw new Error("The second word is missing");

            expect(challenge.background).not.toBe(challenge.color);
            expect(challenge.background).not.toBe(challenge.second.color);
        }
    });

    it("only turns the word upside down with SYMMETRY, a mirror left to right would change nothing", () => {
        const mirrors = new Set<ModifierId>();
        for (let run = 0; run < 200; run++) {
            const { modifiers } = createChallenge(["mirror", "splitMirror"], 20, Math.random);
            for (const id of modifiers) mirrors.add(id);
        }

        expect([...mirrors].sort()).toEqual(["mirrorVertical", "splitMirror"]);
    });

    it("expects true with two words when both are true or both are false", () => {
        const combinations = new Set<string>();
        for (let run = 0; run < 2000; run++) {
            const challenge = createChallenge(["twoWords"], 20, Math.random);
            if (!challenge.second) throw new Error("The second word is missing");

            const firstTrue = challenge.word === challenge.color;
            const secondTrue = challenge.second.word === challenge.second.color;
            expect(challenge.expected).toBe(firstTrue === secondTrue ? "true" : "false");
            combinations.add(`${firstTrue}/${secondTrue}`);
        }

        expect(combinations.size).toBe(4);
        expect(createChallenge(["mirror"], 20, Math.random).second).toBeNull();
    });

    it("only shrinks the word with the zoom modifier", () => {
        expect(createChallenge(["zoom"], 20, Math.random, {}, 0.2).size).toBe(0.2);
        expect(createChallenge(["mirror"], 20, Math.random, {}, 0.2).size).toBe(1);
        expect(createChallenge([], 20, Math.random).size).toBe(1);
    });
});
