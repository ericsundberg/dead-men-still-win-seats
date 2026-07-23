import type { RulerGender } from '../../game/ruler-profile';
import { text } from '../../localization/localized-text';
import { makeElement } from '../../ui/dom-helpers';

export interface RulerCreationFields {
  readonly givenNameInput: HTMLInputElement;
  readonly familyNameInput: HTMLInputElement;
  readonly startingAgeInput: HTMLInputElement;
  readonly genderSelect: HTMLSelectElement;
}

export function createRulerCreationFields(): RulerCreationFields {
  return {
    givenNameInput: makeTextInput(
      'given-name',
      text('gameSetup.givenNamePlaceholder'),
    ),
    familyNameInput: makeTextInput(
      'family-name',
      text('gameSetup.familyNamePlaceholder'),
    ),
    startingAgeInput: makeAgeInput(),
    genderSelect: makeGenderSelect(),
  };
}

export function appendRulerCreationFieldLabels(
  form: HTMLElement,
  fields: RulerCreationFields,
): void {
  form.append(
    makeInputLabel(text('gameSetup.givenNameLabel'), fields.givenNameInput),
    makeInputLabel(text('gameSetup.familyNameLabel'), fields.familyNameInput),
    makeInputLabel(text('gameSetup.startingAgeLabel'), fields.startingAgeInput),
    makeInputLabel(text('gameSetup.genderLabel'), fields.genderSelect),
  );
}

function makeTextInput(
  name: string,
  placeholder: string,
): HTMLInputElement {
  const input = document.createElement('input');

  input.name = name;
  input.placeholder = placeholder;
  input.autocomplete = 'off';

  return input;
}

function makeAgeInput(): HTMLInputElement {
  const input = document.createElement('input');

  input.name = 'starting-age';
  input.type = 'number';
  input.min = '1';
  input.max = '99';
  input.step = '1';
  input.value = '25';

  return input;
}

function makeGenderSelect(): HTMLSelectElement {
  const select = document.createElement('select');

  appendGenderOption(select, 'unspecified', text('gameSetup.genderUnspecified'));
  appendGenderOption(select, 'woman', text('gameSetup.genderWoman'));
  appendGenderOption(select, 'man', text('gameSetup.genderMan'));
  appendGenderOption(select, 'nonbinary', text('gameSetup.genderNonbinary'));

  return select;
}

function appendGenderOption(
  select: HTMLSelectElement,
  value: RulerGender,
  label: string,
): void {
  const option = document.createElement('option');

  option.value = value;
  option.textContent = label;

  select.append(option);
}

function makeInputLabel(
  labelText: string,
  input: HTMLInputElement | HTMLSelectElement,
): HTMLLabelElement {
  const label = makeElement('label', {
    textContent: labelText,
  });

  label.append(input);

  return label;
}