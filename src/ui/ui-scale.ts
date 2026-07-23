const storageKey = 'dead-men-still-win-seats.ui-scale';
const defaultScale = 1;
const minimumScale = 0.8;
const maximumScale = 1.4;
const scaleStep = 0.1;

export function getUiScale(): number {
  const savedScale = Number(localStorage.getItem(storageKey));

  if (!Number.isFinite(savedScale)) {
    return defaultScale;
  }

  return clampScale(savedScale);
}

export function applyUiScale(scale = getUiScale()): void {
  document.documentElement.style.setProperty('--ui-scale', scale.toFixed(2));
}

export function increaseUiScale(): number {
  return setUiScale(getUiScale() + scaleStep);
}

export function decreaseUiScale(): number {
  return setUiScale(getUiScale() - scaleStep);
}

export function resetUiScale(): number {
  return setUiScale(defaultScale);
}

function setUiScale(scale: number): number {
  const clampedScale = clampScale(scale);

  localStorage.setItem(storageKey, clampedScale.toFixed(2));
  applyUiScale(clampedScale);

  return clampedScale;
}

function clampScale(scale: number): number {
  return Math.min(maximumScale, Math.max(minimumScale, scale));
}