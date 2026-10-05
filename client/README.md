# Client Bomberman Arena

Client de jeu (Electron + TypeScript + PixiJS) : menu principal, salle
d'attente multijoueur et portails du moteur de rendu. Ce document explique
comment l'installer, le lancer, le tester, et comment le code est organisé.

## Prérequis

- **Node.js ≥ 24.20.0** (version déclarée dans `package.json`).
- npm (installé avec Node).

## Installation

```bash
cd client
npm install
```

## Scripts

| Commande | Effet |
|---|---|
| `npm run build` | Compile TypeScript vers des `.js` **à côté** des `.ts` : `tsc` (processus Electron) puis `tsc -p tsconfig.web.json` (renderer + navigateur). |
| `npm start` | `build` puis lance Electron. |
| `npm test` | Lance les tests Vitest une fois. |
| `npm run test:watch` | Vitest en mode surveillance. |

> ⚠️ Les `.js` générés par le build sont dans `.gitignore`, mais **Vitest les
> charge à la place des `.ts`** s'ils sont présents (même dossier, même nom).
> Après un `npm run build`, supprime-les avant de tester, sinon tu risques de
> tester une ancienne version du code :
> ```powershell
> Get-ChildItem -Recurse -Path src -Include *.js,*.d.ts,*.js.map -File | Remove-Item -Force
> ```

## Architecture

L'interface est Dessinée dans un **espace de conception fixe de 1280x720** ;
`renderer.ts` calcule un facteur d'échelle et centre l'écran courant dans la
fenêtre (`layout()`). Les composants positionnent donc leurs éléments dans ce
repère, sans se soucier de la taille réelle de la fenêtre.

```
client/
├─ main.ts / preload.ts    # processus Electron (fenêtre) et pont de sécurité
├─ index.html              # charge PixiJS (import map locale) puis le renderer
└─ src/
   ├─ renderer.ts          # bootstrap PixiJS + câblage des écrans et du lobby
   ├─ design.ts            # jetons partagés : palette, polices, 1280x720, styles
   ├─ previews.ts          # chargement des planches → textures, fabrique de sprites
   ├─ imageLoader.ts       # chargement d'images avec quelques tentatives
   ├─ firstCell.ts /       # découpe d'une planche : première pose rognée sur
   │  planche.ts           #   son contenu (analyse des pixels)
   ├─ AnimationPersonnageMenu.ts  # démo animée du personnage dans le menu
   ├─ components/          # briques d'affichage réutilisables
   │  ├─ Button.ts           # bouton cliquable (sensible à la souris)
   │  ├─ Grid.ts             # quadrillage de mise en page (fond d'écran)
   │  ├─ PlayerSlot.ts       # emplacement d'un joueur dans la salle
   │  └─ CharacterPicker.ts  # cadre cliquable : changer de personnage
   ├─ screens/             # écrans complets
   │  ├─ Menu.ts             # menu principal (JOUER / OPTIONS / QUITTER)
   │  └─ WaitingMenu.ts      # salle d'attente (4 emplacements + prêt)
   └─ lobby/               # modèle de la salle, sans dépendance graphique
      ├─ LobbyBus.ts         # bus d'événements : état + règles de la salle
      ├─ LobbyMock.ts        # faux serveur (arrivées différées) pour develops
      └─ characters.ts       # catalogue des personnages (id, planche)
```

### Bus d'événements (le « modèle »)

Aucun écran ne parle au réseau. Les événements du lobby (arrivées, départs,
états « prêt », changements de personnage) passent par `LobbyBus` :

- le serveur — réel (WebSocket) ou simulé (`LobbyMock`) — publie l'état ;
- les écrans s'abonnent avec `bus.on(...)` et se redessinent ;
- l'utilisateur agit : l'écran **notifie** via un callback, et c'est le
  renderer qui décide quoi écrire dans le bus.

Le bus contient aussi les **règles de la salle** (fonctions pures, testables
seules) : `canStartGame()`, `MIN_PLAYERS`, `MAX_PLAYERS`.

## Règles de la salle d'attente

- **2 à 4 joueurs** : une partie ne se lance jamais en solo
  (`MIN_PLAYERS`, `MAX_PLAYERS`). La synthèse affiche « Il faut au moins 2
  joueurs pour commencer » quand la salle est trop petite.
- Une partie démarre quand **tout le monde est prêt** (`canStartGame`) ;
  l'écran d'attente n'affiche que l'information, le lancement appartient à
  l'écran de jeu.
- **Un personnage par joueur** : le catalogue est attribué à l'arrivée, et le
  sélecteur ne propose que des personnages libres.
- Chaque joueur voit **son personnage** dans un cadre cliquable au centre de
  son emplacement (clic = personnage suivant libre) ; les autres joueurs
  voient simplement leur portrait.

## Tests

```bash
npm test        # 72 tests (Vitest)
```

Les tests unitaires mockent PixiJS (bouches minimales) et ne dépendent ni du
DOM ni du réseau. Couverture actuelle : règles et état du lobby, mock
d'arrivées, catalogue des personnages, découpe des planches, jetons de design,
démonstration du menu, et l'écran d'attente (emplacements, portraits, sélecteur,
compteur, conditions de lancement).

Non couvert : `renderer.ts` et `previews.ts` (dépendent du DOM / du canvas) et
`imageLoader.ts` — ce sont des points d'entrée applicatifs.

## Ressources

- `assets/perso1.jpg` … `perso4.jpg` : planches de personnages (la première
  pose sert de portrait dans la salle d'attente).
- `assets/perso1.png` : sprite utilisé par la démo du menu.

## Reste à faire (à venir)

- **Protocole WebSocket** : le branchement réel remplacera `LobbyMock` (le bus
  est déjà prêt à le consommer).
- **Écran Options** : arrive sur une branche dédiée (le bouton existe déjà dans
  le menu).
- **Choix du pseudo** : à faire avant d'entrer en salle.
- **Jeu** : déplacements synchronisés, bombes, explosions (jalon 2).