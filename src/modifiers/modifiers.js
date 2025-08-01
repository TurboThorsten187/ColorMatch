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
        super("InvertInputModifier", 10, ["NoClickModifier", "SpamClickModifier"]);
    }
}

export class NoClickModifier extends Modifier {
    constructor() {
        super("NoClickModifier", 10, ["InvertInputModifier", "SpamClickModifier"]);
    }
}

export class SpamClickModifier extends Modifier {
    constructor() {
        super("SpamClickModifier", 15, ["NoClickModifier", "InvertInputModifier", "BackgroundColorModifier", "BlinkModifier", "InvertColorsModifier"]);
    }
}

// Visual Modifiers
export class VerticalMirrorModifier extends Modifier {
    constructor() {
        super("VerticalMirrorModifier", 5);
    }
}

export class HorizontalMirrorModifier extends Modifier {
    constructor() {
        super("HorizontalMirrorModifier", 5);
    }
}

export class BackgroundColorModifier extends Modifier {
    constructor() {
        super("BackgroundColorModifier", 5, ["SpamClickModifier"]);
    }
}

export class BlinkModifier extends Modifier {
    constructor() {
        super("BlinkModifier", 10, ["SpamClickModifier"]);
    }
}

export class InvertColorsModifier extends Modifier {
    constructor() {
        super("InvertColorsModifier", 15, ["SpamClickModifier"]);
    }
}

export class BlurredModifier extends Modifier {
    constructor() {
        super("BlurredModifier", 10);
    }
}

export class RotationModifier extends Modifier {
    constructor() {
        super("RotationModifier", 10);
    }
}

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