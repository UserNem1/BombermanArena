import { Container, Texture, Rectangle, Sprite } from 'pixi.js';
import { TILE_SIZE } from '../core/grid';

const FRAME_SIZE = 32;
const STEP = 33;

// Configuration par direction : ligne du spritesheet + nombre de frames à utiliser
const DIRECTIONS = {
  down:  { row: 0, frameCount: 3 },
  up:    { row: 2, frameCount: 3 },
  side:  { row: 3, frameCount: 3 }, // utilisé pour gauche, et retourné pour droite
};

type Direction = 'up' | 'down' | 'left' | 'right';

export class Player extends Container {
  private sprite: Sprite;
  private frames: Record<string, Texture[]> = {};
  private frameIndex = 0;
  private frameTimer = 0;
  private readonly frameDuration = 8;
  private currentDirection: Direction = 'down';

  constructor(baseTexture: Texture) {
    super();

    // Découpe les frames pour chaque direction définie
    for (const [key, config] of Object.entries(DIRECTIONS)) {
      const textures: Texture[] = [];
      for (let col = 0; col < config.frameCount; col++) {
        const frame = new Rectangle(col * STEP, config.row * STEP, FRAME_SIZE, FRAME_SIZE);
        textures.push(new Texture({ source: baseTexture.source, frame }));
      }
      this.frames[key] = textures;
    }

    this.sprite = new Sprite(this.frames.down![0]!);
    this.sprite.width = TILE_SIZE;
    this.sprite.height = TILE_SIZE;
    this.sprite.anchor.set(0.5);
    this.sprite.x = TILE_SIZE / 2;
    this.sprite.y = TILE_SIZE / 2;

    this.addChild(this.sprite);
  }

  private getFrameSetKey(direction: Direction): string {
    if (direction === 'left' || direction === 'right') return 'side';
    return direction;
  }

  update(isMoving: boolean, direction?: Direction) {
    if (direction) {
      // Si on change de direction, on repart de la frame 0
      if (direction !== this.currentDirection) {
        this.frameIndex = 0;
        this.frameTimer = 0;
      }
      this.currentDirection = direction;
    }

    this.sprite.scale.x = this.currentDirection === 'right' ? -1 : 1;

    const frameSetKey = this.getFrameSetKey(this.currentDirection);
    const frameSet = this.frames[frameSetKey]!;

    if (isMoving) {
      this.frameTimer++;
      if (this.frameTimer >= this.frameDuration) {
        this.frameTimer = 0;
        this.frameIndex = (this.frameIndex + 1) % frameSet.length;
        this.sprite.texture = frameSet[this.frameIndex]!;
      }
    } else {
      this.frameIndex = 0;
      this.frameTimer = 0;
      this.sprite.texture = frameSet[0]!;
    }
  }
}