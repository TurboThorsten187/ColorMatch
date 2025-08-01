import { InputType } from "./challenge.js";
import { GameLoopStateInstance as GLS } from "./gameLoopState.js";

export function applyLogicModifiers(challenge) {
  let correctInput = challenge.correctInput;

  if (GLS.activeModifiers !== null && GLS.activeModifiers.some(mod => mod.name === "InvertInput")) {
    correctInput = correctInput === InputType.TRUE ? InputType.FALSE : InputType.TRUE;
  }

  if (GLS.activeModifiers !== null && GLS.activeModifiers.some(mod => mod.name === "NoClick")) {
    correctInput = InputType.NONE;
  }

  if (GLS.activeModifiers !== null && GLS.activeModifiers.some(mod => mod.name === "SpamClick")) {
    correctInput = InputType.SPAM;
  }

  return correctInput;
}
