/**
 * Tests unitaires du lecteur de musique (audio/MenuMusic.ts).
 *
 * Aucun son n'est réellement joué : un faux élément audio remplace
 * `HTMLAudioElement` pour observer les appels à `play`/`pause` et les
 * réglages appliqués.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { MenuMusic } from './MenuMusic.js';

/** Faux élément audio : mémorise son état et ses appels. */
function makeFakeAudio(playResult: () => Promise<void> = () => Promise.resolve()) {
  const audio = {
    loop: false,
    preload: '',
    volume: 1,
    paused: true,
    play: vi.fn(() => {
      audio.paused = false;
      // Comme un navigateur : un échec de lecture remet `paused` à true.
      return playResult().catch((error: unknown) => {
        audio.paused = true;
        throw error;
      });
    }),
    pause: vi.fn(() => {
      audio.paused = true;
    }),
  };

  return audio;
}

/** Fabrique un lecteur branché sur un faux élément audio. */
function makePlayer(audio = makeFakeAudio()) {
  const createAudio = vi.fn(() => audio as unknown as HTMLAudioElement);
  return { player: new MenuMusic('assets/music_menu.ogg', createAudio), audio, createAudio };
}

/** Laisse les promesses rejetées être traitées par les `catch` internes. */
async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('MenuMusic', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('crée un seul élément audio, réutilisé à chaque lecture', () => {
    const { player, createAudio } = makePlayer();

    player.play();
    player.play();

    expect(createAudio).toHaveBeenCalledTimes(1);
    expect(createAudio).toHaveBeenCalledWith('assets/music_menu.ogg');
  });

  it('joue en boucle avec le volume par défaut', () => {
    const { player, audio } = makePlayer();

    player.play();

    expect(audio.play).toHaveBeenCalledTimes(1);
    expect(audio.loop).toBe(true);
    expect(audio.preload).toBe('auto');
    expect(audio.volume).toBe(0.5);
  });

  it('ne relance pas la lecture si la musique joue déjà', () => {
    const { player, audio } = makePlayer();

    player.play();
    player.play();

    expect(audio.play).toHaveBeenCalledTimes(1);
  });

  it('met en pause la musique en cours', () => {
    const { player, audio } = makePlayer();

    player.play();
    player.pause();

    expect(audio.pause).toHaveBeenCalledTimes(1);
    expect(audio.paused).toBe(true);
  });

  it("ne crée pas d'élément audio pour une pause sans lecture", () => {
    const { player, createAudio } = makePlayer();

    player.pause();

    expect(createAudio).not.toHaveBeenCalled();
  });

  it("borne le volume entre 0 et 1 et l'applique", () => {
    const { player, audio } = makePlayer();
    player.play();

    player.setVolume(2);
    expect(player.getVolume()).toBe(1);
    expect(audio.volume).toBe(1);

    player.setVolume(-1);
    expect(player.getVolume()).toBe(0);
    expect(audio.volume).toBe(0);
  });

  it("conserve le volume réglé avant la création de l'élément audio", () => {
    const { player, audio } = makePlayer();

    player.setVolume(0.25);
    player.play();

    expect(audio.volume).toBe(0.25);
  });

  it("survit à un refus d'autoplay", async () => {
    const audio = makeFakeAudio(() => Promise.reject(new Error('autoplay bloqué')));
    const { player } = makePlayer(audio);

    expect(() => player.play()).not.toThrow();
    // Laisse la promesse rejetée être traitée par le `catch` interne.
    await flushPromises();
  });

  it("n'installe qu'une paire d'écouteurs pour le premier geste", async () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    vi.stubGlobal('window', { addEventListener, removeEventListener });

    const audio = makeFakeAudio(() => Promise.reject(new Error('autoplay bloqué')));
    const { player } = makePlayer(audio);

    // Deux tentatives refusées : une seule attente doit être installée.
    player.play();
    await flushPromises();
    player.play();
    await flushPromises();

    expect(addEventListener.mock.calls.map(([type]) => type)).toEqual([
      'pointerdown',
      'keydown',
    ]);

    // Premier clic : la lecture est retentée et les écouteurs retirés.
    const onFirstGesture = addEventListener.mock.calls[0][1] as () => void;
    onFirstGesture();

    expect(audio.play).toHaveBeenCalledTimes(3);
    expect(removeEventListener).toHaveBeenCalledTimes(2);
  });

  it("retire l'attente du premier geste lors d'une pause", async () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    vi.stubGlobal('window', { addEventListener, removeEventListener });

    const audio = makeFakeAudio(() => Promise.reject(new Error('autoplay bloqué')));
    const { player } = makePlayer(audio);

    player.play();
    await flushPromises();
    expect(addEventListener).toHaveBeenCalledTimes(2);

    player.pause();

    expect(removeEventListener).toHaveBeenCalledTimes(2);
    expect(audio.pause).toHaveBeenCalledTimes(1);
  });

  it('indique si la musique est en cours de lecture', () => {
    const { player } = makePlayer();

    expect(player.isPlaying()).toBe(false);

    player.play();
    expect(player.isPlaying()).toBe(true);

    player.pause();
    expect(player.isPlaying()).toBe(false);
  });
});
