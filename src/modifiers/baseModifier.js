export class Modifier {
    constructor(name) {
        this.name = name;
    }

    apply(challenge) {
        return challenge;
    }
}
