import type { AudioServices } from '../audio/audio-services';

export function bindButtonBrushSfx(
  rootElement: HTMLElement,
  audio: AudioServices,
): () => void {
  const handlePointerOver = (event: PointerEvent): void => {
    /*
      Do not play hover sounds for touch interactions. A touch normally means
      the user is pressing the button rather than merely hovering over it.
    */
    if (event.pointerType === 'touch') {
      return;
    }

    /*
      Browser audio normally cannot play until the user has clicked, pressed
      a key, or otherwise completed an accepted unlocking gesture.
    */
    if (!audio.unlocker.getIsUnlocked()) {
      return;
    }

    const eventTarget = event.target;

    if (!(eventTarget instanceof Element)) {
      return;
    }

    const button = eventTarget.closest('button');

    if (
      !(button instanceof HTMLButtonElement)
      || !rootElement.contains(button)
      || button.matches(':disabled')
      || button.getAttribute('aria-disabled') === 'true'
    ) {
      return;
    }

    /*
      pointerover bubbles from child elements. Difficulty buttons, for example,
      contain several spans. This check prevents the sound from restarting when
      the pointer moves between elements inside the same button.
    */
    const previousTarget = event.relatedTarget;

    if (
      previousTarget instanceof Node
      && button.contains(previousTarget)
    ) {
      return;
    }

    audio.sfx.play('button-brush');
  };

  rootElement.addEventListener('pointerover', handlePointerOver);

  return () => {
    rootElement.removeEventListener('pointerover', handlePointerOver);
  };
}