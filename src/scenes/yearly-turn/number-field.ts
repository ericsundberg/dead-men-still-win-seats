import { makeElement } from '../../ui/dom-helpers';

export function makeNumberInput(name: string, value: number): HTMLInputElement {
  const input = document.createElement('input');

  input.name = name;
  input.type = 'number';
  input.min = '0';
  input.step = '1';
  input.value = String(value);

  return input;
}

export function makeNumberLabel(
  labelText: string,
  input: HTMLInputElement,
): HTMLLabelElement {
  const label = makeElement('label', {
    textContent: labelText,
  });

  label.append(input);

  return label;
}

export function readWholeNumber(input: HTMLInputElement): number {
  const parsedValue = Number.parseInt(input.value, 10);

  if (!Number.isFinite(parsedValue)) {
    return 0;
  }

  return Math.max(0, parsedValue);
}
