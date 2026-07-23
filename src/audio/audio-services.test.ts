import { describe, expect, it } from 'vitest';
import { createAudioServices } from './audio-services';

describe('audio services', () => {
  it('creates shared audio services', () => {
    const audio = createAudioServices();

    expect(audio.music.has('main-menu-theme')).toBe(true);
    expect(audio.sfx.has('button-click')).toBe(true);
    expect(audio.sfx.has('button-cancel')).toBe(true);
    expect(audio.unlocker.getIsUnlocked()).toBe(false);
  });
});
