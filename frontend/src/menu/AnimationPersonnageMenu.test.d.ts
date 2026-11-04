/**
 * Tests de la machine à états de AnimationPersonnageMenu.
 *
 * La classe fait du rendu (elle étend Container Pixi) : on mocke pixi.js
 * avec des faux sprites qui enregistrent position/visibilité/opacité, et
 * on pilote `update(dt)` en simulant le temps. On vérifie ainsi l'enchaînement
 * des phases (marche -> présentation -> marche -> saut -> mort -> pause)
 * et les positions clés, sans navigateur ni GPU.
 */
export {};
//# sourceMappingURL=AnimationPersonnageMenu.test.d.ts.map