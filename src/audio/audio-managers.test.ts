import { describe, expect, it, vi } from 'vitest';
import { MusicManager } from './music-manager';
import { SfxManager } from './sfx-manager';

describe('audio managers', () => {
  it('finds known music track IDs', () => {
    const musicManager = new MusicManager();

    expect(musicManager.has('main-menu-theme')).toBe(true);
    expect(musicManager.has('missing-theme')).toBe(false);
    expect(musicManager.getIds()).toContain('main-menu-theme');
  });

  it('finds known sfx IDs', () => {
    const sfxManager = new SfxManager();

    expect(sfxManager.has('button-click')).toBe(true);
    expect(sfxManager.has('button-cancel')).toBe(true);
    expect(sfxManager.has('missing-sfx')).toBe(false);
    expect(sfxManager.getIds()).toContain('button-click');
    expect(sfxManager.getIds()).toContain('button-cancel');
  });

  it('does not throw when asked to play a missing sfx id', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const sfxManager = new SfxManager();

    expect(() => sfxManager.play('missing-sfx')).not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith('[audio:sfx] missing asset id: missing-sfx');

    warnSpy.mockRestore();
  });

  it('does not throw when asked to play a missing music id', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const musicManager = new MusicManager();

    expect(() => musicManager.play('missing-theme')).not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith('[audio:music] missing asset id: missing-theme');

    warnSpy.mockRestore();
  });
});
