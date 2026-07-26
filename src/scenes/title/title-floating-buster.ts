export const titleFloatingBusterImagePath =
  [
    import.meta.env.BASE_URL,
    'assets/art/floating-head-buster.png',
  ].join('');

export const titleFloatingBusterLabel =
  'Hear Senator Buster introduce himself';

export function makeTitleFloatingBuster(
  onActivate:
    () => void,
): HTMLButtonElement {
  const button =
    document.createElement(
      'button',
    );

  button.type =
    'button';

  button.className =
    'title-floating-buster';

  button.setAttribute(
    'aria-label',
    titleFloatingBusterLabel,
  );

  button.title =
    titleFloatingBusterLabel;

  const motion =
    document.createElement(
      'span',
    );

  motion.className =
    'title-floating-buster-motion';

  motion.setAttribute(
    'aria-hidden',
    'true',
  );

  const image =
    document.createElement(
      'img',
    );

  image.className =
    'title-floating-buster-image';

  image.src =
    titleFloatingBusterImagePath;

  image.alt =
    '';

  image.draggable =
    false;

  motion.append(
    image,
  );

  button.append(
    motion,
  );

  button.addEventListener(
    'click',
    onActivate,
  );

  return button;
}
