export const GameState = {
    MENU: "menu",
    PLAYING: "playing",
    WAIT_AFTER_SPAM: "wait_after_spam",
    GAME_OVER: "game_over",
} as const;

export type GameState = (typeof GameState)[keyof typeof GameState];

export const Game: { state: GameState } = {
    state: GameState.MENU,
};
