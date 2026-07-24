import { makeElement } from '../../ui/dom-helpers';

const svgNamespace = 'http://www.w3.org/2000/svg';
const titleWaveFilterId = 'title-background-wave-filter';
const titleStarCount = 200;

export function makeTitleBackground(): HTMLElement {
  const background = makeElement('div', {
    className: 'title-background',
  });

  background.setAttribute('aria-hidden', 'true');

  const waveFilterDefinitions =
    createTitleWaveFilterDefinitions();

  const stripes = makeElement('div', {
    className: 'title-background-stripes',
  });

  const starField = makeElement('div', {
    className: 'title-background-stars',
  });

  for (let index = 0; index < titleStarCount; index += 1) {
    starField.append(makeTitleStar(index));
  }

  /*
    The filter definitions and stripes are separate from the star field.

    Only .title-background-stripes references the SVG filter, so the stars
    retain their existing straight falling paths.
  */
  background.append(
    waveFilterDefinitions,
    stripes,
    starField,
  );

  return background;
}

function createTitleWaveFilterDefinitions(): SVGSVGElement {
  const svg = makeSvgElement('svg');

  svg.setAttribute(
    'class',
    'title-background-wave-filter-definitions',
  );
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  const definitions = makeSvgElement('defs');
  const filter = makeSvgElement('filter');

  filter.id = titleWaveFilterId;
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
    '0.0025 0.011',
  );
  turbulence.setAttribute('numOctaves', '1');
  turbulence.setAttribute('seed', '23');
  turbulence.setAttribute('stitchTiles', 'stitch');
  turbulence.setAttribute('result', 'wave-noise');

  const softenedNoise =
    makeSvgElement('feGaussianBlur');

  softenedNoise.setAttribute('in', 'wave-noise');
  softenedNoise.setAttribute('stdDeviation', '1.8');
  softenedNoise.setAttribute(
    'result',
    'soft-wave-noise',
  );

  const movingNoise = makeSvgElement('feOffset');

  movingNoise.setAttribute('in', 'soft-wave-noise');
  movingNoise.setAttribute('dx', '-80');
  movingNoise.setAttribute('dy', '-24');
  movingNoise.setAttribute(
    'result',
    'moving-wave-noise',
  );

  if (!prefersReducedMotion()) {
    movingNoise.append(
      createAttributeAnimation({
        attributeName: 'dy',
        values: '-40;40;-40',
        duration: '40s',
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

  displacement.setAttribute('in', 'SourceGraphic');
  displacement.setAttribute(
    'in2',
    'moving-wave-noise',
  );
  displacement.setAttribute('scale', '32');
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
  animation.setAttribute('values', options.values);
  animation.setAttribute('dur', options.duration);
  animation.setAttribute(
    'repeatCount',
    'indefinite',
  );
  animation.setAttribute('calcMode', 'spline');
  animation.setAttribute('keyTimes', '0;0.5;1');
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

function makeTitleStar(index: number): HTMLElement {
  const star = makeElement('span', {
    className: 'title-background-star',
  });

  /*
    These formulas generate a repeatable arrangement rather than relying on
    Math.random(). The background therefore looks the same after navigation.
  */
  const sizeRem = 1 + ((index * 7) % 13) / 10;
  const durationSeconds = 10 + ((index * 11) % 8);
  const delaySeconds = -((index * 17) % 18);
  const opacity = 0.5 + ((index * 23) % 45) / 100;

  setStarProperty(
    star,
    '--star-left',
    `${(index * 37) % 100}%`,
  );

  setStarProperty(
    star,
    '--star-top',
    `${(index * 53) % 96}%`,
  );

  setStarProperty(
    star,
    '--star-size',
    `${sizeRem.toFixed(1)}rem`,
  );

  setStarProperty(
    star,
    '--star-duration',
    `${durationSeconds}s`,
  );

  setStarProperty(
    star,
    '--star-delay',
    `${delaySeconds}s`,
  );

  setStarProperty(
    star,
    '--star-opacity',
    opacity.toFixed(2),
  );

  setStarProperty(
    star,
    '--star-origin-x',
    `${-55 - ((index * 13) % 35)}vw`,
  );

  setStarProperty(
    star,
    '--star-destination-x',
    `${35 + ((index * 19) % 45)}vw`,
  );

  setStarProperty(
    star,
    '--star-spin',
    `${180 + ((index * 31) % 360)}deg`,
  );

  return star;
}

function setStarProperty(
  star: HTMLElement,
  propertyName: string,
  value: string,
): void {
  star.style.setProperty(propertyName, value);
}