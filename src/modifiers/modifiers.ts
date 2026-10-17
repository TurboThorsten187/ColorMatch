export type ModifierName =
    | "InvertInputModifier"
    | "NoClickModifier"
    | "SpamClickModifier"
    | "VerticalMirrorModifier"
    | "HorizontalMirrorModifier"
    | "BackgroundColorModifier"
    | "BlinkModifier"
    | "InvertColorsModifier"
    | "BlurredModifier"
    | "RotationModifier";

export interface Modifier {
    readonly name: ModifierName;
    readonly minLevel: number;
    readonly conflictsWith: readonly ModifierName[];
}

export const ALL_MODIFIERS: readonly Modifier[] = [
    // Input-Logic-Modifiers
    { name: "InvertInputModifier", minLevel: 10, conflictsWith: ["NoClickModifier", "SpamClickModifier"] },
    { name: "NoClickModifier", minLevel: 10, conflictsWith: ["InvertInputModifier", "SpamClickModifier"] },
    {
        name: "SpamClickModifier",
        minLevel: 15,
        conflictsWith: ["NoClickModifier", "InvertInputModifier", "BackgroundColorModifier", "BlinkModifier", "InvertColorsModifier"],
    },

    // Visual Modifiers
    { name: "VerticalMirrorModifier", minLevel: 5, conflictsWith: [] },
    { name: "HorizontalMirrorModifier", minLevel: 5, conflictsWith: [] },
    { name: "BackgroundColorModifier", minLevel: 5, conflictsWith: ["SpamClickModifier"] },
    { name: "BlinkModifier", minLevel: 10, conflictsWith: ["SpamClickModifier"] },
    { name: "InvertColorsModifier", minLevel: 30, conflictsWith: ["SpamClickModifier"] },
    { name: "BlurredModifier", minLevel: 10, conflictsWith: [] },
    { name: "RotationModifier", minLevel: 10, conflictsWith: [] },
];

export function hasModifier(modifiers: readonly Modifier[], name: ModifierName): boolean {
    return modifiers.some(m => m.name === name);
}
