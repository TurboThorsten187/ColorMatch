export class VerticalMirrorModifier extends Modifier {
    constructor() {
        super("verticalMirror");
        this.conflictsWith = [];
        this.minLevel = 5;
    }

    apply(challenge) {
        return challenge;
    }
}