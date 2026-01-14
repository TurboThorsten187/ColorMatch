import { InputType } from "./challenge.js";
import { GameLoopStateInstance as GLS } from "./gameLoopState.js";

export function applyLogicModifiers(challenge) {
  const modifiers = GLS.activeModifiers ?? [];
  let correctInput = challenge.correctInput;

  if (modifiers.some(mod => mod.name === "InvertInputModifier")) {
    correctInput = correctInput === InputType.TRUE ? InputType.FALSE : InputType.TRUE;
  }

  if (modifiers.some(mod => mod.name === "NoClickModifier")) {
    correctInput = InputType.NONE;
  }

  if (modifiers.some(mod => mod.name === "SpamClickModifier")) {
    correctInput = InputType.SPAM;
  }

  return correctInput;
}
