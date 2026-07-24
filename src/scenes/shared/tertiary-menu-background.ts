const svgNamespace = 'http://www.w3.org/2000/svg';
const waveFilterId = 'tertiary-menu-wave-filter';

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

  const filterDefinitions =
    createWaveFilterDefinitions();

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
    filterDefinitions,
    stripes,
    ripples,
    shade,
    grain,
  );

  sceneElement.prepend(background);
}

function createWaveFilterDefinitions(): SVGSVGElement {
  const svg = makeSvgElement('svg');

  svg.setAttribute(
    'class',
    'tertiary-menu-wave-filter-definitions',
  );
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  const definitions = makeSvgElement('defs');
  const filter = makeSvgElement('filter');

  filter.id = waveFilterId;
  filter.setAttribute('x', '-20%');
  filter.setAttribute('y', '-20%');
  filter.setAttribute('width', '140%');
  filter.setAttribute('height', '140%');
  filter.setAttribute(
    'color-interpolation-filters',
    'sRGB',
  );

  const turbulence = makeSvgElement('feTurbulence');

  turbulence.setAttribute('type', 'fractalNoise');
  turbulence.setAttribute(
    'baseFrequency',
    '0.003 0.016',
  );
  turbulence.setAttribute('numOctaves', '1');
  turbulence.setAttribute('seed', '17');
  turbulence.setAttribute(
    'stitchTiles',
    'stitch',
  );
  turbulence.setAttribute('result', 'wave-noise');

  const softenedNoise =
    makeSvgElement('feGaussianBlur');

  softenedNoise.setAttribute('in', 'wave-noise');
  softenedNoise.setAttribute(
    'stdDeviation',
    '1.8',
  );
  softenedNoise.setAttribute(
    'result',
    'soft-wave-noise',
  );

  const movingNoise = makeSvgElement('feOffset');

  movingNoise.setAttribute(
    'in',
    'soft-wave-noise',
  );
  movingNoise.setAttribute('dx', '-80');
  movingNoise.setAttribute('dy', '-24');
  movingNoise.setAttribute(
    'result',
    'moving-wave-noise',
  );

  if (!prefersReducedMotion()) {
    movingNoise.append(
      createAttributeAnimation({
        attributeName: 'dx',
        values: '-80;80;-80',
        duration: '28s',
      }),
      createAttributeAnimation({
        attributeName: 'dy',
        values: '-24;24;-24',
        duration: '36s',
      }),
    );
  }

  const displacement =
    makeSvgElement('feDisplacementMap');

  displacement.setAttribute(
    'in',
    'SourceGraphic',
  );
  displacement.setAttribute(
    'in2',
    'moving-wave-noise',
  );
  displacement.setAttribute('scale', '20');
  displacement.setAttribute(
    'xChannelSelector',
    'R',
  );
  displacement.setAttribute(
    'yChannelSelector',
    'G',
  );

  filter.append(
    turbulence,
    softenedNoise,
    movingNoise,
    displacement,
  );

  definitions.append(filter);
  svg.append(definitions);

  return svg;
}

interface AttributeAnimationOptions {
  readonly attributeName: string;
  readonly values: string;
  readonly duration: string;
}

function createAttributeAnimation(
  options: AttributeAnimationOptions,
): SVGAnimateElement {
  const animation = makeSvgElement('animate');

  animation.setAttribute(
    'attributeName',
    options.attributeName,
  );
  animation.setAttribute(
    'values',
    options.values,
  );
  animation.setAttribute('dur', options.duration);
  animation.setAttribute(
    'repeatCount',
    'indefinite',
  );
  animation.setAttribute(
    'calcMode',
    'spline',
  );
  animation.setAttribute(
    'keyTimes',
    '0;0.5;1',
  );
  animation.setAttribute(
    'keySplines',
    '0.45 0 0.55 1;0.45 0 0.55 1',
  );

  return animation;
}

function prefersReducedMotion(): boolean {
  return globalThis.matchMedia?.(
    '(prefers-reduced-motion: reduce)',
  ).matches ?? false;
}

function makeSvgElement<
  K extends keyof SVGElementTagNameMap,
>(
  tagName: K,
): SVGElementTagNameMap[K] {
  return document.createElementNS(
    svgNamespace,
    tagName,
  );
}