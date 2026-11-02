// core/Game.ts
import { Container } from 'pixi.js';
export class Game {
    app;
    gameContainer;
    constructor(app) {
        this.app = app;
        this.gameContainer = new Container();
        this.app.stage.addChild(this.gameContainer);
        this.app.ticker.add(this.update.bind(this));
    }
    update(ticker) {
        // logique de jeu à chaque frame
    }
}
