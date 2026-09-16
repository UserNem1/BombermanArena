/**
 * Point d'entrée du renderer (couche d'affichage).
 *
 * Ce fichier initialise l'application PixiJS qui servira de moteur
 * de rendu pour l'ensemble des écrans du jeu (menu, partie, etc.).
 *
 * Architecture visée : un Event Bus découplera la logique réseau
 * (WebSocket) de ce moteur de rendu, conformément aux exigences du
 * devoir. À ce stade, seul le canvas vide est créé.
 */

import { Application } from 'pixi.js';

/** Application PixiJS : contient le renderer, le stage et la boucle de rendu. */
const app = new Application();

/**
 * Initialise l'application PixiJS.
 *
 * - `resizeTo: window` : le canvas s'adapte à la taille de la fenêtre.
 * - `background` : fond noir plein écran (base pour construire le menu).
 */
await app.init({ resizeTo: window, background: '#000000' });

/** Ajoute le canvas de rendu PixiJS au document HTML. */
document.body.appendChild(app.canvas);