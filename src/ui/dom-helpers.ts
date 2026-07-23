export interface MakeElementOptions {
  readonly className?: string;
  readonly textContent?: string;
}

export interface MakeButtonOptions {
  readonly onBeforeClick?: () => void;
}

export function makeElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  options: MakeElementOptions = {},
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);

  if (options.className) {
    element.className = options.className;
  }

  if (options.textContent) {
    element.textContent = options.textContent;
  }

  return element;
}

export function makeButton(
  label: string,
  onClick: () => void,
  className = 'menu-button',
  options: MakeButtonOptions = {},
): HTMLButtonElement {
  const button = document.createElement('button');

  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.addEventListener('click', () => {
    options.onBeforeClick?.();
    onClick();
  });

  return button;
}

export function replaceChildren(
  parentElement: HTMLElement,
  childElement: HTMLElement,
): void {
  parentElement.replaceChildren(childElement);
}
