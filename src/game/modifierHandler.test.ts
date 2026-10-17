import { describe, expect, it } from "vitest";
import { applyLogicModifiers } from "./modifierHandler.ts";
import { InputType } from "./challenge.ts";
import { ALL_MODIFIERS, type ModifierName } from "../modifiers/modifiers.ts";

function modifiers(...names: ModifierName[]) {
    return ALL_MODIFIERS.filter(m => names.includes(m.name));
}

describe("applyLogicModifiers", () => {
    it("keeps the answer without logic modifiers", () => {
        expect(applyLogicModifiers(InputType.TRUE, modifiers("BlurredModifier"))).toBe(InputType.TRUE);
    });

    it("inverts the answer", () => {
        expect(applyLogicModifiers(InputType.TRUE, modifiers("InvertInputModifier"))).toBe(InputType.FALSE);
        expect(applyLogicModifiers(InputType.FALSE, modifiers("InvertInputModifier"))).toBe(InputType.TRUE);
    });

    it("expects no input for NoClick and spamming for SpamClick", () => {
        expect(applyLogicModifiers(InputType.TRUE, modifiers("NoClickModifier"))).toBe(InputType.NONE);
        expect(applyLogicModifiers(InputType.FALSE, modifiers("SpamClickModifier"))).toBe(InputType.SPAM);
    });
});
