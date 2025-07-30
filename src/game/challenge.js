export const InputType = Object.freeze({
    TRUE: "true",
    FALSE: "false",
    NONE: "none",
    SPAM: "spam",
});

export class Challenge {
    constructor(text, color, correctInput) {
        this.text = text;
        this.color = color;
        this.correctInput = correctInput;
    }
}
