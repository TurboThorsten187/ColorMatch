export const ALL_MODIFIERS = [
    new InvertInputModifier(),
    new NoClickModifier(),
    new SpamClickModifier(),
    new VerticalMirrorModifier(),
    new HorizontalMirrorModifier(),
    new BackgroundColorModifier(),
    new BlinkModifier(),
    new InvertColorsModifier(),
    new BlurredModifier(),
    new RotationModifier()
];

export class Modifier {
    constructor(name, minLevel, conflictsWith = []) {
        this.name = name;
        this.minLevel = minLevel;
        this.conflictsWith = conflictsWith;
    }
}

// Input-Logic-Modifiers
export class InvertInputModifier extends Modifier {
    constructor() {
        super("InvertInput", 10, ["NoClick", "SpamClick"]);
    }
}

export class NoClickModifier extends Modifier {
    constructor() {
        super("NoClick", 10, ["InvertInput", "SpamClick"]);
    }
}

export class SpamClickModifier extends Modifier {
    constructor() {
        super("SpamClick", 15, ["Noclick", "InvertInput", "BackgroundColor", "Blink", "InvertColors"]);
    }
}

// Visual Modifiers
export class VerticalMirrorModifier extends Modifier {
    constructor() {
        super("VerticalMirror", 5);
    }
}

export class HorizontalMirrorModifier extends Modifier {
    constructor() {
        super("HorizontalMirror", 5);
    }
}

export class BackgroundColorModifier extends Modifier {
    constructor() {
        super("BackgroundColor", 5, ["SpamClick"]);
    }
}

export class BlinkModifier extends Modifier {
    constructor() {
        super("Blink", 10, ["SpamClick"]);
    }
}

export class InvertColorsModifier extends Modifier {
    constructor() {
        super("InvertColors", 15, ["SpamClick"]);
    }
}

export class BlurredModifier extends Modifier {
    constructor() {
        super("Blurred", 10);
    }
}

export class RotationModifier extends Modifier {
    constructor() {
        super("Rotation", 10);
    }
}