// core/Game.ts
import { Application, Container } from 'pixi.js';

export class Game {
  app: Application;
  gameContainer: Container;

  constructor(app: Application) {
    this.app = app;
    this.gameContainer = new Container();
    this.app.stage.addChild(this.gameContainer);
    this.app.ticker.add(this.update.bind(this));
  }

  update(ticker: { deltaTime: number }) {
    // logique de jeu à chaque frame
  }
}