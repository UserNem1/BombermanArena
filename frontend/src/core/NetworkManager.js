export class NetworkManager {
    socket;
    handlers = new Map();
    constructor(url) {
        this.socket = new WebSocket(url);
        this.socket.onopen = () => {
            console.log('Connecté au serveur');
        };
        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.dispatch(message.type, message.data);
        };
        this.socket.onclose = () => {
            console.log('Déconnecté du serveur');
        };
        this.socket.onerror = (err) => {
            console.error('Erreur WebSocket', err);
        };
    }
    // S'abonner à un type de message venant du serveur
    on(type, handler) {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, []);
        }
        this.handlers.get(type).push(handler);
    }
    dispatch(type, data) {
        const handlers = this.handlers.get(type);
        if (handlers) {
            handlers.forEach((h) => h(data));
        }
    }
    // Envoyer un message au serveur
    send(type, data) {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type, data }));
        }
    }
}
