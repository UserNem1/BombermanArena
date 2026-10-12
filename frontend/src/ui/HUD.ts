import { Container, Text, TextStyle, Graphics } from 'pixi.js';

export class HUD extends Container {
  private killText: Text;
  private timeText: Text;
  private kills: number = 0;

  constructor(screenWidth: number) {
    super();

    // Fond de la barre HUD
    const background = new Graphics()
      .rect(0, 0, screenWidth, 50)
      .fill(0x2c2c2c);
    this.addChild(background);

    const style = new TextStyle({
      fill: 0xffffff,
      fontSize: 18,
      fontWeight: 'bold',
      fontFamily: 'Arial',
    });

    // Compteur de kills
    this.killText = new Text({ text: 'Kills: 0', style });
    this.killText.x = 20;
    this.killText.y = 14;
    this.addChild(this.killText);

    // Timer (positionné au centre)
    this.timeText = new Text({ text: '02:00', style });
    this.timeText.x = screenWidth / 2 - 30;
    this.timeText.y = 14;
    this.addChild(this.timeText);
  }

  updateKills(count: number) {
    this.kills = count;
    this.killText.text = `Kills: ${this.kills}`;
  }

  updateTime(seconds: number) {
    const min = Math.floor(seconds / 60).toString().padStart(2, '0');
    const sec = (seconds % 60).toString().padStart(2, '0');
    this.timeText.text = `${min}:${sec}`;
  }
}