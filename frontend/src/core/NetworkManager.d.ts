type MessageHandler = (data: any) => void;
export declare class NetworkManager {
    private socket;
    private handlers;
    constructor(url: string);
    on(type: string, handler: MessageHandler): void;
    private dispatch;
    send(type: string, data: any): void;
}
export {};
//# sourceMappingURL=NetworkManager.d.ts.map