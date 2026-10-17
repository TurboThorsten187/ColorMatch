import { InputType } from "./challenge.ts";
import { hasModifier, type Modifier } from "../modifiers/modifiers.ts";

export function applyLogicModifiers(correctInput: InputType, modifiers: readonly Modifier[]): InputType {
    if (hasModifier(modifiers, "InvertInputModifier")) {
        correctInput = correctInput === InputType.TRUE ? InputType.FALSE : InputType.TRUE;
    }

    if (hasModifier(modifiers, "NoClickModifier")) {
        correctInput = InputType.NONE;
    }

    if (hasModifier(modifiers, "SpamClickModifier")) {
        correctInput = InputType.SPAM;
    }

    return correctInput;
}
