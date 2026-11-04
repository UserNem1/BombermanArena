/**
 * Tests de la machine à états de AnimationPersonnageMenu.
 *
 * La classe fait du rendu (elle étend Container Pixi) : on mocke pixi.js
 * avec des faux sprites qui enregistrent position/visibilité/opacité, et
 * on pilote `update(dt)` en simulant le temps. On vérifie ainsi l'enchaînement
 * des phases (marche -> présentation -> marche -> saut -> mort -> pause)
 * et les positions clés, sans navigateur ni GPU.
 */

import { describe, expect, it, vi } from 'vitest';
import { AnimatedSprite } from 'pixi.js';
import { AnimationPersonnageMenu } from './AnimationPersonnageMenu.js';

// Mock minimal de pixi.js : Container + AnimatedSprite suffisent à
// instancier la classe et à tracer ses appels (position, alpha, visible).
vi.mock('pixi.js', () => {
  class Container {
    children: unknown[] = [];
    addChild(child: unknown): unknown {
      this.children.push(child);
      return child;
    }
  }
  class AnimatedSprite extends Container {
    animationSpeed = 0;
    loop = false;
    anchor = {
      set(_x: number, _y: number): void {},
    };
    position = {
      x: 0,
      y: 0,
      set(x: number, y: number): void {
        this.x = x;
        this.y = y;
      },
    };
    visible = true;
    alpha = 1;
    play(): void {}
    stop(): void {}
    gotoAndPlay(_frame: number): void {}
  }
  return {
    Container,
    AnimatedSprite,
    Rectangle: class Rectangle {},
    Texture: class Texture {},
    TextureSource: class TextureSource {},
  };
});

/** Construit une démo avec 4 faux sprites et garde leurs références. */
function makeDemo(): {
  demo: AnimationPersonnageMenu;
  sprites: Record<'walk' | 'intro' | 'jump' | 'death', AnimatedSprite>;
} {
  const sprites = {
    walk: new AnimatedSprite([]),
    intro: new AnimatedSprite([]),
    jump: new AnimatedSprite([]),
    death: new AnimatedSprite([]),
  };
  // Le constructeur est privé (cabinet) : on le contourne en TS via un cast.
  const Ctor = AnimationPersonnageMenu as unknown as new (
    walk: AnimatedSprite,
    intro: AnimatedSprite,
    jump: AnimatedSprite,
    death: AnimatedSprite,
  ) => AnimationPersonnageMenu;
  const demo = new Ctor(sprites.walk, sprites.intro, sprites.jump, sprites.death);
  return { demo, sprites };
}

describe('AnimationPersonnageMenu (machine à états)', () => {
  it('démarre en marche hors écran, sprite de marche visible', () => {
    const { demo, sprites } = makeDemo();
    expect(sprites.walk.visible).toBe(true);
    expect(sprites.walk.position.x).toBe(-80); // SPAWN_X
    expect(sprites.intro.visible).toBe(false);
    expect(sprites.jump.visible).toBe(false);
    expect(sprites.death.visible).toBe(false);
    void demo;
  });

  it('entre en présentation à partir de l’abscisse INTRO_X puis reprend la marche', () => {
    const { demo, sprites } = makeDemo();
    // 2 s de marche : -80 + 330*2 = 580 >= INTRO_X (300).
    demo.update(2);
    expect(sprites.intro.visible).toBe(true);
    expect(sprites.walk.visible).toBe(false);
    expect(sprites.intro.position.x).toBe(580);
    // La présentation dure 3,5 s : après 4 s on repart en marche.
    demo.update(4);
    expect(sprites.walk.visible).toBe(true);
    expect(sprites.intro.visible).toBe(false);
    // Position conservée (pas de remise à SPAWN_X : keepWalkPos).
    expect(sprites.walk.position.x).toBe(580);
  });

  it('saute à droite quand la marche atteint JUMP_X, en arc parabolique', () => {
    const { demo, sprites } = makeDemo();
    demo.update(2); // 580 -> présentation
    demo.update(4); // retour marche à 580
    demo.update(2); // 580 + 660 = 1240 >= JUMP_X (950) -> saut
    expect(sprites.jump.visible).toBe(true);
    expect(sprites.jump.position.x).toBe(950);
    // Moitié du saut (0,5 s sur 1,1 s) : point haut = FLOOR_Y - 150.
    demo.update(0.55);
    expect(sprites.jump.position.y).toBe(550);
  });

  it('s’efface en fondu pendant la mort, puis marque une pause', () => {
    const { demo, sprites } = makeDemo();
    demo.update(2); // marche -> présentation
    demo.update(4); // présentation -> marche
    demo.update(2); // marche -> saut
    demo.update(1.2); // saut terminé -> mort
    expect(sprites.death.visible).toBe(true);
    expect(sprites.death.alpha).toBe(1);
    demo.update(0.5); // mi-fondu
    expect(sprites.death.alpha).toBeCloseTo(0.5);
    demo.update(0.6); // mort terminée -> pause : rien de visible
    expect(sprites.death.visible).toBe(false);
    expect(sprites.intro.visible).toBe(false);
    expect(sprites.jump.visible).toBe(false);
    expect(sprites.walk.visible).toBe(false);
  });

  it('boucle : après la pause, retour à gauche et nouvelle présentation', () => {
    const { demo, sprites } = makeDemo();
    demo.update(2); // marche -> présentation
    demo.update(4); // présentation -> marche
    demo.update(2); // marche -> saut
    demo.update(1.2); // saut -> mort
    demo.update(1.1); // mort -> pause
    demo.update(1.1); // pause terminée -> retour à la marche
    expect(sprites.walk.visible).toBe(true);
    expect(sprites.walk.position.x).toBe(-80); // SPAWN_X, remis à zéro
    // 2 s : le tour de présentation rejoue (introDone réinitialisé).
    demo.update(2);
    expect(sprites.intro.visible).toBe(true);
  });
});