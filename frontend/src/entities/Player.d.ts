import { Container, Texture } from 'pixi.js';
type Direction = 'up' | 'down' | 'left' | 'right';
export declare class Player extends Container {
    private sprite;
    private frames;
    private frameIndex;
    private frameTimer;
    private readonly frameDuration;
    private currentDirection;
    constructor(baseTexture: Texture);
    private getFrameSetKey;
    update(isMoving: boolean, direction?: Direction): void;
}
export {};
//# sourceMappingURL=Player.d.ts.map