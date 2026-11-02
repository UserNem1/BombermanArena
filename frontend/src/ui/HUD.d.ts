import { Container } from 'pixi.js';
export declare class HUD extends Container {
    private killText;
    private timeText;
    private kills;
    constructor(screenWidth: number);
    updateKills(count: number): void;
    updateTime(seconds: number): void;
}
//# sourceMappingURL=HUD.d.ts.map