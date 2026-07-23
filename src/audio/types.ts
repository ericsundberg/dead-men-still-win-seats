export type AudioVolume = number;

export interface BaseAudioManifestEntry {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  readonly volume: AudioVolume;
}

export interface MusicManifestEntry extends BaseAudioManifestEntry {
  readonly loop: boolean;
}

export interface SfxManifestEntry extends BaseAudioManifestEntry {
  readonly allowOverlap: boolean;
}

export type MusicManifest = Record<string, MusicManifestEntry>;
export type SfxManifest = Record<string, SfxManifestEntry>;

export interface AudioSettings {
  readonly masterVolume: AudioVolume;
  readonly musicVolume: AudioVolume;
  readonly sfxVolume: AudioVolume;
  readonly isMuted: boolean;
}
