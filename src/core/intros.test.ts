import { describe, expect, it } from "vitest";
import { MODIFIER_GROUPS } from "@/modifiers/registry.ts";
import { INTROS, introExample, type IntroId, newIntros } from "./intros.ts";

function word(id: IntroId, elapsed: number) {
    const example = introExample(id, elapsed);
    if (example.kind !== "word") throw new Error(`${id} shows a sign`);
    return example;
}

function signText(id: IntroId, elapsed: number): string {
    const example = introExample(id, elapsed);
    if (example.kind !== "sign") throw new Error(`${id} shows a word`);
    return example.sign.text;
}

describe("modifier intros", () => {
    it("are needed once per modifier group, in list order", () => {
        expect(newIntros(["mirror", "rotation"], [])).toEqual(["mirror", "rotation"]);
        expect(newIntros(["mirror", "rotation"], ["mirror"])).toEqual(["rotation"]);
        expect(newIntros([], [])).toEqual([]);
    });

    it("cover every modifier group exactly once", () => {
        expect(INTROS.map((intro) => intro.id).sort()).toEqual(MODIFIER_GROUPS.map((group) => group.id).sort());
    });
});

describe("intro examples", () => {
    it("play every group as a challenge of it, or show its sign", () => {
        for (const { id } of INTROS) {
            for (const elapsed of [0, 700, 5000]) {
                const example = introExample(id, elapsed);
                if (example.kind === "word") {
                    expect(example.challenge.groups).toEqual([id]);
                    expect(example.challenge.modifiers.size).toBe(1);
                }
            }
        }
        expect(introExample("noClick", 0)).toMatchObject({ kind: "sign", sign: { text: "DON'T CLICK" } });
    });

    it("take turns with WAIT and NOW", () => {
        expect([0, 900, 1100, 1900, 2100].map((elapsed) => signText("wait", elapsed))).toEqual([
            "WAIT",
            "WAIT",
            "NOW",
            "NOW",
            "WAIT",
        ]);
    });

    it("show every mirror in turn", () => {
        const mirrors = [0, 1000, 2000, 3000].map((elapsed) => [...word("mirror", elapsed).challenge.modifiers][0]);

        expect(new Set(mirrors.slice(0, 3)).size).toBe(3);
        expect(mirrors[3]).toBe(mirrors[0]);
    });

    it("start over after their loop, as a level of their time limit", () => {
        expect(word("blink", 1800 + 300).elapsed).toBe(300);
        expect(word("assemble", 2200 + 100)).toMatchObject({ elapsed: 100, timeLimit: 4000 });
        expect(word("moving", 12345).elapsed).toBe(12345);
        expect(word("moving", 0).timeLimit).toBe(Infinity);
    });

    it("light up SPAM! press by press, keep it complete for a moment and start over", () => {
        const counts = Array.from({ length: 8 }, (_, step) => word("spam", step * 300 + 10).spamCount);

        expect(counts).toEqual([0, 1, 2, 3, 4, 5, 6, 0]);
    });

    it("give the examples what their demo says", () => {
        expect(word("rotation", 0).challenge.rotationDeg).toBe(-24);
        expect(word("zoom", 0).challenge.size).toBe(0.3);
        expect(word("background", 0).challenge.background).toBe("red");
        expect(word("twoWords", 0).challenge.second).toEqual({ word: "red", color: "blue" });
    });
});
