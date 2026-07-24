export function appendTertiaryMenuBackground(
  sceneElement: HTMLElement,
): void {
  if (
    sceneElement.querySelector(
      '.tertiary-menu-background',
    )
  ) {
    return;
  }

  sceneElement.classList.add('tertiary-menu-scene');

  const background = document.createElement('div');

  background.className = 'tertiary-menu-background';

  const stripes = document.createElement('div');

  stripes.className =
    'tertiary-menu-background-stripes';

  const ripples = document.createElement('div');

  ripples.className =
    'tertiary-menu-background-ripples';

  const shade = document.createElement('div');

  shade.className =
    'tertiary-menu-background-shade';

  const grain = document.createElement('div');

  grain.className =
    'tertiary-menu-background-grain';

  background.append(
    stripes,
    ripples,
    shade,
    grain,
  );

  sceneElement.prepend(background);
}