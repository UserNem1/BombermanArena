type MessageHandler = (data: any) => void;

export class NetworkManager {
  private socket: WebSocket;
  private handlers: Map<string, MessageHandler[]> = new Map();

  constructor(url: string) {
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
  on(type: string, handler: MessageHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);
  }

  private dispatch(type: string, data: any) {
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.forEach((h) => h(data));
    }
  }

  // Envoyer un message au serveur
  send(type: string, data: any) {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, data }));
    }
  }
}