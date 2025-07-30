class GameLoopState {
    #currentChallenge = null;
    #activeModifiers = [];
    #currentLevel = 1;
    #correctInput = true;
    #timer = 3000;
    #inputReceived = false;
    #decisionStartTime = Date.now();

    reset() {
        this.#currentChallenge = null;
        this.#activeModifiers = [];
        this.#currentLevel = 1;
        this.#correctInput = true;
        this.#timer = 3000;
        this.#inputReceived = false;
        this.#decisionStartTime = Date.now();
    }

    get currentChallenge() {
        return this.#currentChallenge;
    }

    set currentChallenge(challenge) {
        this.#currentChallenge = challenge;
    }

    get activeModifiers() {
        return this.#activeModifiers;
    }

    set activeModifiers(modifiers) {
        this.#activeModifiers = modifiers;
    }

    get currentLevel() {
        return this.#currentLevel;
    }

    set currentLevel(level) {
        this.#currentLevel = level;
    }

    incrementLevel() {
        this.#currentLevel++;
    }

    get correctInput() {
        return this.#correctInput;
    }

    set correctInput(value) {
        this.#correctInput = value;
    }

    toggleCorrectInput() {
        this.#correctInput = !this.#correctInput;
    }

    get timer() {
        return this.#timer;
    }

    set timer(time) {
        this.#timer = time;
    }

    get inputReceived() {
        return this.#inputReceived;
    }

    set inputReceived(received) {
        this.#inputReceived = received;
    }

    get decisionStartTime() {
        return this.#decisionStartTime;
    }

    set decisionStartTime(time) {
        this.#decisionStartTime = time;
    }
}

export const GameLoopStateInstance = new GameLoopState();
