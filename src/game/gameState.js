export const GameState = Object.freeze({
    MENU: "menu",
    PLAYING: "playing",
    WAIT_AFTER_SPAM: "wait_after_spam",
    GAME_OVER: "game_over"
});

class GameClass {
    #state = GameState.MENU;

    get state() {
        return this.#state;
    }

    set state(newState) {
        if (!Object.values(GameState).includes(newState)) {
            throw new Error("Invalid game state: " + newState);
        }
        this.#state = newState;
    }
}

export const Game = new GameClass();
