// core/InputManager.ts
export class InputManager {
    keys = new Set();
    constructor() {
        window.addEventListener('keydown', (e) => this.keys.add(e.key));
        window.addEventListener('keyup', (e) => this.keys.delete(e.key));
    }
    isPressed(key) {
        return this.keys.has(key);
    }
}
