import { describe, expect, it } from "vitest";
import { DOUBLE_TAPS } from "@/modifiers/doubleTap/doubleTap.ts";
import { MODIFIER_GROUPS } from "@/modifiers/registry.ts";
import { SPAM_PRESSES_NEEDED } from "@/modifiers/spam/spam.ts";
import type { LevelContext, ModifierGroupId, ModifierId } from "@/modifiers/types.ts";
import { WAIT_SHARE } from "@/modifiers/wait/wait.ts";
import { ZOOM_SIZE } from "@/modifiers/zoom/zoom.ts";
import { createChallenge } from "./challenge.ts";

// A level of a normal game whose groups were all introduced on `introducedOn`
function at(level: number, introducedOn = 1): LevelContext {
    return { level, mode: "normal", introducedOn: () => introducedOn };
}

// The plain answer of a challenge's word
const truth = (challenge: { word: string; color: string }) => (challenge.word === challenge.color ? "true" : "false");

describe("rules", () => {
    it("keep the plain answer without a rule group", () => {
        for (let run = 0; run < 100; run++) {
            const challenge = createChallenge(["blur"], Math.random);

            expect(challenge.expected).toBe(truth(challenge));
            expect(challenge.presses).toBe(1);
            expect(challenge.lockedShare).toBe(0);
        }
    });

    it("invert the answer", () => {
        for (let run = 0; run < 100; run++) {
            const challenge = createChallenge(["invertInput"], Math.random);

            expect(challenge.expected).toBe(truth(challenge) === "true" ? "false" : "true");
        }
    });

    it("expect no input with Don't Click and repeated presses anywhere with SPAM!", () => {
        expect(createChallenge(["noClick"], Math.random).expected).toBe("none");
        expect(createChallenge(["spam"], Math.random)).toMatchObject({
            expected: "spam",
            presses: SPAM_PRESSES_NEEDED,
        });
    });

    it("ask for the answer twice with DOUBLE TAP and lock the start of a WAIT level", () => {
        expect(createChallenge(["doubleTap"], Math.random).presses).toBe(DOUBLE_TAPS);
        expect(createChallenge(["wait"], Math.random).lockedShare).toBe(WAIT_SHARE);
    });
});

describe("createChallenge", () => {
    it("expects true exactly when the word names its own color", () => {
        for (let run = 0; run < 500; run++) {
            const challenge = createChallenge([], Math.random);

            expect(challenge.modifiers.size).toBe(0);
            expect(challenge.expected).toBe(challenge.word === challenge.color ? "true" : "false");
        }
    });

    it("uses one modifier of every picked group", () => {
        for (let run = 0; run < 200; run++) {
            const challenge = createChallenge(["mirror", "blur", "spam"], Math.random, at(20));

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
                Math.random,
                at(40),
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
            const challenge = createChallenge(["background"], Math.random, at(20));
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
            const challenge = createChallenge(["background", "twoWords"], Math.random, at(20));
            if (!challenge.second) throw new Error("The second word is missing");

            expect(challenge.background).not.toBe(challenge.color);
            expect(challenge.background).not.toBe(challenge.second.color);
        }
    });

    it("only turns the word upside down with SYMMETRY, a mirror left to right would change nothing", () => {
        const mirrors = new Set<ModifierId>();
        for (let run = 0; run < 200; run++) {
            const { modifiers } = createChallenge(["mirror", "splitMirror"], Math.random, at(20));
            for (const id of modifiers) mirrors.add(id);
        }

        expect([...mirrors].sort()).toEqual(["mirrorVertical", "splitMirror"]);
    });

    it("expects true with two words when both are true or both are false", () => {
        const combinations = new Set<string>();
        for (let run = 0; run < 2000; run++) {
            const challenge = createChallenge(["twoWords"], Math.random, at(20));
            if (!challenge.second) throw new Error("The second word is missing");

            const firstTrue = challenge.word === challenge.color;
            const secondTrue = challenge.second.word === challenge.second.color;
            expect(challenge.expected).toBe(firstTrue === secondTrue ? "true" : "false");
            combinations.add(`${firstTrue}/${secondTrue}`);
        }

        expect(combinations.size).toBe(4);
        expect(createChallenge(["mirror"], Math.random, at(20)).second).toBeNull();
    });

    it("only shrinks the word with the zoom modifier", () => {
        expect(createChallenge(["zoom"], Math.random, at(20, 20)).size).toBe(ZOOM_SIZE);
        expect(createChallenge(["mirror"], Math.random, at(20, 20)).size).toBe(1);
        expect(createChallenge([], Math.random).size).toBe(1);
    });

    it("lists its groups in the order of the registry", () => {
        const groups: ModifierGroupId[] = ["twoWords", "rotation", "mirror"];

        expect(createChallenge(groups, Math.random).groups).toEqual(["mirror", "rotation", "twoWords"]);
    });

    it("keeps the strength of its groups", () => {
        expect(createChallenge(["blur"], Math.random, at(20), {}, { blur: 0.5 }).strength).toEqual({ blur: 0.5 });
        expect(createChallenge(["blur"], Math.random, at(20)).strength).toEqual({});
    });
});
