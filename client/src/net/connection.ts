/**
 * Module réseau du client.
 *
 * Gère la connexion WebSocket unique vers le serveur backend. Le
 * renderer Electron (Chromium) fournit l'API `WebSocket` native : aucune
 * dépendance supplémentaire n'est nécessaire. Pour l'instant on se
 * contente d'ouvrir la connexion et de journaliser les événements dans
 * la console du renderer — l'échange de messages viendra ensuite.
 */

/** Adresse du serveur backend (voir backend/server.ts, port 8080). */
const SERVER_URL = 'ws://localhost:8080';

/** Socket en cours d'établissement ou établie, ou null si déconnecté. */
let socket: WebSocket | null = null;

/**
 * Ouvre la connexion WebSocket vers le serveur.
 *
 * Si une connexion est déjà en cours ou établie, on la réutilise : un
 * second clic sur JOUER ne doit pas ouvrir de double connexion. Les
 * événements `open`, `close` et `error` sont journalisés dans la console
 * du renderer pour le suivi.
 *
 * @returns La socket WebSocket créée (ou réutilisée).
 */
export function connectToServer(): WebSocket {
  if (socket && socket.readyState <= WebSocket.OPEN) {
    console.log('[net] déjà connecté au serveur');
    return socket;
  }

  socket = new WebSocket(SERVER_URL);

  socket.addEventListener('open', () => {
    console.log(`[net] connecté au serveur ${SERVER_URL}`);
  });

  socket.addEventListener('close', () => {
    console.log('[net] déconnecté du serveur');
    socket = null;
  });

  socket.addEventListener('error', () => {
    console.error(
      '[net] erreur de connexion — le serveur est-il démarré ? (npm start dans backend/)',
    );
  });

  return socket;
}

/**
 * Indique si une connexion est actuellement établie.
 *
 * @returns true si la socket est ouverte.
 */
export function isConnected(): boolean {
  return socket?.readyState === WebSocket.OPEN;
}
