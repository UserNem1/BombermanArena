import { Application, Container } from 'pixi.js';
export declare class Game {
    app: Application;
    gameContainer: Container;
    constructor(app: Application);
    update(ticker: {
        deltaTime: number;
    }): void;
}
//# sourceMappingURL=Game.d.ts.map