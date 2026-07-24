const secondaryMenuArtPaths = [
  `${import.meta.env.BASE_URL}assets/art/art-barn.jpg`,
  `${import.meta.env.BASE_URL}assets/art/art-campaign.jpg`,
  `${import.meta.env.BASE_URL}assets/art/art-river-valley.jpg`,
] as const;

export function appendSecondaryMenuBackground(
  sceneElement: HTMLElement,
): void {
  if (sceneElement.querySelector('.secondary-menu-background')) {
    return;
  }

  sceneElement.classList.add('secondary-menu-scene');

  const background = document.createElement('div');

  background.className = 'secondary-menu-background';

  for (const [index, artPath] of secondaryMenuArtPaths.entries()) {
    const imageLayer = document.createElement('div');
    const cycleDelay = `${index * -20}s`;

    imageLayer.className = 'secondary-menu-background-image';

    imageLayer.style.setProperty(
      '--secondary-menu-image',
      `url("${artPath}")`,
    );

    imageLayer.style.setProperty(
      '--secondary-menu-cycle-delay',
      cycleDelay,
    );

    background.append(imageLayer);
  }

  const tintLayer = document.createElement('div');

  tintLayer.className = 'secondary-menu-background-tint';

  const grainLayer = document.createElement('div');

  grainLayer.className = 'secondary-menu-background-grain';

  background.append(
    tintLayer,
    grainLayer,
  );

  sceneElement.prepend(background);
}