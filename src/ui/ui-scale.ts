const storageKey = 'dead-men-still-win-seats.ui-scale';

export const defaultUiScale = 1;
export const minimumUiScale = 0.75;
export const maximumUiScale = 1.5;
export const uiScaleStep = 0.01;

export function getUiScale(): number {
  const savedScaleText = localStorage.getItem(storageKey);

  if (savedScaleText === null) {
    return defaultUiScale;
  }

  const savedScale = Number.parseFloat(savedScaleText);

  if (!Number.isFinite(savedScale)) {
    return defaultUiScale;
  }

  return clampScale(savedScale);
}

export function applyUiScale(
  scale = getUiScale(),
): void {
  document.documentElement.style.setProperty(
    '--ui-scale',
    scale.toFixed(2),
  );
}

export function setUiScale(scale: number): number {
  const clampedScale = clampScale(scale);

  /*
    Continue storing the scale as a decimal multiplier,
    such as "0.75", "1.00", or "1.50".
  */
  localStorage.setItem(
    storageKey,
    clampedScale.toFixed(2),
  );

  applyUiScale(clampedScale);

  return clampedScale;
}

function clampScale(scale: number): number {
  return Math.min(
    maximumUiScale,
    Math.max(minimumUiScale, scale),
  );
}