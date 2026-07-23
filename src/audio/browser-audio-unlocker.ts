const silentWavDataUri =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQQAAAAAAA==';

export class BrowserAudioUnlocker {
  private isUnlocked = false;
  private unlockPromise: Promise<boolean> | null = null;

  public getIsUnlocked(): boolean {
    return this.isUnlocked;
  }

  public async unlock(): Promise<boolean> {
    if (this.isUnlocked) {
      return true;
    }

    if (this.unlockPromise) {
      return this.unlockPromise;
    }

    this.unlockPromise = this.tryUnlock();

    const wasUnlocked = await this.unlockPromise;

    this.isUnlocked = wasUnlocked;

    if (!wasUnlocked) {
      this.unlockPromise = null;
    }

    return wasUnlocked;
  }

  public bindToFirstGesture(
    element: HTMLElement,
    onUnlocked?: () => void,
  ): () => void {
    const handleGesture = (): void => {
      void this.unlock().then((wasUnlocked) => {
        if (wasUnlocked) {
          cleanup();
          onUnlocked?.();
        }
      });
    };

    const cleanup = (): void => {
      element.removeEventListener('pointerdown', handleGesture);
      element.removeEventListener('keydown', handleGesture);
      element.removeEventListener('touchstart', handleGesture);
    };

    element.addEventListener('pointerdown', handleGesture);
    element.addEventListener('keydown', handleGesture);
    element.addEventListener('touchstart', handleGesture);

    return cleanup;
  }

  private async tryUnlock(): Promise<boolean> {
    if (typeof Audio === 'undefined') {
      console.warn('[audio] browser Audio API unavailable; cannot unlock audio');
      return false;
    }

    const audio = new Audio(silentWavDataUri);

    audio.muted = true;
    audio.volume = 0;

    try {
      await audio.play();
      audio.pause();
      audio.removeAttribute('src');
      audio.load();

      console.log('[audio] browser audio unlocked');
      return true;
    } catch (error) {
      console.warn('[audio] browser audio unlock failed', error);
      return false;
    }
  }
}
