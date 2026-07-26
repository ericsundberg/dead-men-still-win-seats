import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  gameplayMusicTrackIds,
  musicManifest,
  selectGameplayMusicTrackId,
} from './music-manifest';
import { sfxManifest } from './sfx-manifest';

function toPublicFilePath(assetPath: string): string {
  return join(
    process.cwd(),
    'public',
    assetPath.replace(/^\//, ''),
  );
}

describe('audio manifests', () => {
  it('uses stable matching music IDs', () => {
    for (const [id, entry] of Object.entries(musicManifest)) {
      expect(entry.id).toBe(id);
    }
  });

  it('uses stable matching sfx IDs', () => {
    for (const [id, entry] of Object.entries(sfxManifest)) {
      expect(entry.id).toBe(id);
    }
  });

  it('routes music through the public audio music path', () => {
    for (const entry of Object.values(musicManifest)) {
      expect(entry.path).toMatch(/^\/assets\/audio\/music\/.+\.ogg$/);
    }
  });

  it('routes sfx through the public audio sfx path', () => {
    for (const entry of Object.values(sfxManifest)) {
      expect(entry.path).toMatch(/^\/assets\/audio\/sfx\/.+\.ogg$/);
    }
  });

  it('points music manifest entries to existing public assets', () => {
    for (const entry of Object.values(musicManifest)) {
      const publicFilePath = toPublicFilePath(entry.path);

      expect(publicFilePath).toContain('/public/assets/audio/music/');
      expect(existsSync(publicFilePath)).toBe(true);
    }
  });

  it('points implemented interface sfx entries to existing public assets', () => {
    const implementedSfxEntries = [
      sfxManifest['button-brush'],
      sfxManifest['button-click'],
      sfxManifest['button-cancel'],
      sfxManifest['hi-im-buster'],
    ];

    for (const entry of implementedSfxEntries) {
      const publicFilePath = toPublicFilePath(entry.path);

      expect(publicFilePath).toContain('/public/assets/audio/sfx/');
      expect(existsSync(publicFilePath)).toBe(true);
    }
  });

  it('keeps manifest volumes inside the safe 0 to 1 range', () => {
    const entries = [
      ...Object.values(musicManifest),
      ...Object.values(sfxManifest),
    ];

    for (const entry of entries) {
      expect(entry.volume).toBeGreaterThanOrEqual(0);
      expect(entry.volume).toBeLessThanOrEqual(1);
    }
  });

  it('keeps the title theme out of the gameplay pool', () => {
    expect(gameplayMusicTrackIds).toHaveLength(12);
    expect(gameplayMusicTrackIds).not.toContain(
      'main-menu-theme',
    );
  });

  it('selects gameplay tracks from the bounded random value', () => {
    expect(
      selectGameplayMusicTrackId([], () => 0),
    ).toBe('backroads-to-your-door');

    expect(
      selectGameplayMusicTrackId([], () => 0.999999),
    ).toBe('moonshine-town');
  });

  it('excludes the five most recently played gameplay tracks', () => {
    const recentTrackIds = [
      'backroads-to-your-door',
      'calgary-hill',
      'campfire-smoke',
      'country-all-the-way',
      'country-back-road',
    ] as const;

    expect(
      selectGameplayMusicTrackId(
        recentTrackIds,
        () => 0,
      ),
    ).toBe('country-jam');
  });
});
