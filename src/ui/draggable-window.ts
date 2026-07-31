export interface DraggableWindowPosition {
  readonly left:
    number;

  readonly top:
    number;
}

export interface DraggableWindowSize {
  readonly width:
    number;

  readonly height:
    number;
}

export interface DraggableWindowBounds {
  readonly top:
    number;

  readonly right:
    number;

  readonly bottom:
    number;

  readonly left:
    number;
}

export interface BindDraggableWindowOptions {
  readonly element:
    HTMLElement;

  readonly handle:
    HTMLElement;

  readonly container:
    HTMLElement;

  readonly bounds?:
    Partial<DraggableWindowBounds>;

  readonly keyboardStep?:
    number;
}

export interface DraggableWindowController {
  readonly dispose:
    () => void;
}

const defaultBounds:
  DraggableWindowBounds = {
    top:
      0,

    right:
      0,

    bottom:
      0,

    left:
      0,
  };

/**
 * Keeps a draggable window inside its logical container.
 */
export function clampDraggableWindowPosition(
  position:
    DraggableWindowPosition,

  containerSize:
    DraggableWindowSize,

  elementSize:
    DraggableWindowSize,

  bounds:
    DraggableWindowBounds =
      defaultBounds,
): DraggableWindowPosition {
  const minimumLeft =
    bounds.left;

  const minimumTop =
    bounds.top;

  const maximumLeft =
    Math.max(
      minimumLeft,
      containerSize.width
        - bounds.right
        - elementSize.width,
    );

  const maximumTop =
    Math.max(
      minimumTop,
      containerSize.height
        - bounds.bottom
        - elementSize.height,
    );

  return {
    left:
      clampNumber(
        position.left,
        minimumLeft,
        maximumLeft,
      ),

    top:
      clampNumber(
        position.top,
        minimumTop,
        maximumTop,
      ),
  };
}

/**
 * Adds pointer and keyboard movement to a floating window.
 *
 * Pointer coordinates are converted from physical browser pixels
 * into the logical coordinate system of the scaled game stage.
 */
export function bindDraggableWindow(
  options:
    BindDraggableWindowOptions,
): DraggableWindowController {
  const bounds: DraggableWindowBounds = {
    ...defaultBounds,
    ...options.bounds,
  };

  const keyboardStep =
    options.keyboardStep
    ?? 16;

  let activePointerId:
    number | null =
      null;

  let currentPosition:
    DraggableWindowPosition | null =
      null;

  let dragOffset:
    DraggableWindowPosition = {
      left:
        0,

      top:
        0,
    };

  const resolveLogicalPointerPosition =
    (
      event:
        PointerEvent,
    ): DraggableWindowPosition => {
      const containerRectangle =
        options.container
          .getBoundingClientRect();

      const horizontalScale =
        containerRectangle.width > 0
          ? options.container.clientWidth
            / containerRectangle.width
          : 1;

      const verticalScale =
        containerRectangle.height > 0
          ? options.container.clientHeight
            / containerRectangle.height
          : 1;

      return {
        left:
          (
            event.clientX
            - containerRectangle.left
          )
          * horizontalScale,

        top:
          (
            event.clientY
            - containerRectangle.top
          )
          * verticalScale,
      };
    };

  const resolveCurrentPosition =
    (): DraggableWindowPosition => {
      const containerRectangle =
        options.container
          .getBoundingClientRect();

      const elementRectangle =
        options.element
          .getBoundingClientRect();

      const horizontalScale =
        containerRectangle.width > 0
          ? options.container.clientWidth
            / containerRectangle.width
          : 1;

      const verticalScale =
        containerRectangle.height > 0
          ? options.container.clientHeight
            / containerRectangle.height
          : 1;

      return {
        left:
          (
            elementRectangle.left
            - containerRectangle.left
          )
          * horizontalScale,

        top:
          (
            elementRectangle.top
            - containerRectangle.top
          )
          * verticalScale,
      };
    };

  const applyPosition =
    (
      requestedPosition:
        DraggableWindowPosition,
    ): void => {
      const nextPosition =
        clampDraggableWindowPosition(
          requestedPosition,
          {
            width:
              options.container
                .clientWidth,

            height:
              options.container
                .clientHeight,
          },
          {
            width:
              options.element
                .offsetWidth,

            height:
              options.element
                .offsetHeight,
          },
          bounds,
        );

      currentPosition =
        nextPosition;

      options.element.style.left =
        `${nextPosition.left}px`;

      options.element.style.top =
        `${nextPosition.top}px`;

      options.element.style.right =
        'auto';

      options.element.style.bottom =
        'auto';

      options.element.style.transform =
        'none';
    };

  const initializeExplicitPosition =
    (): DraggableWindowPosition => {
      if (
        currentPosition
        !== null
      ) {
        return currentPosition;
      }

      const initialPosition =
        resolveCurrentPosition();

      applyPosition(
        initialPosition,
      );

      return currentPosition
        ?? initialPosition;
    };

  const finishPointerDrag =
    (
      event:
        PointerEvent,
    ): void => {
      if (
        activePointerId
        !== event.pointerId
      ) {
        return;
      }

      if (
        options.handle.hasPointerCapture(
          event.pointerId,
        )
      ) {
        options.handle
          .releasePointerCapture(
            event.pointerId,
          );
      }

      activePointerId =
        null;

      options.element
        .classList
        .remove(
          'is-dragging',
        );
    };

  const handlePointerDown =
    (
      event:
        PointerEvent,
    ): void => {
      if (
        event.button
        !== 0
      ) {
        return;
      }

      const windowPosition =
        initializeExplicitPosition();

      const pointerPosition =
        resolveLogicalPointerPosition(
          event,
        );

      dragOffset = {
        left:
          pointerPosition.left
          - windowPosition.left,

        top:
          pointerPosition.top
          - windowPosition.top,
      };

      activePointerId =
        event.pointerId;

      options.handle
        .setPointerCapture(
          event.pointerId,
        );

      options.element
        .classList
        .add(
          'is-dragging',
        );

      event.preventDefault();
    };

  const handlePointerMove =
    (
      event:
        PointerEvent,
    ): void => {
      if (
        activePointerId
        !== event.pointerId
      ) {
        return;
      }

      const pointerPosition =
        resolveLogicalPointerPosition(
          event,
        );

      applyPosition({
        left:
          pointerPosition.left
          - dragOffset.left,

        top:
          pointerPosition.top
          - dragOffset.top,
      });
    };

  const handlePointerUp =
    (
      event:
        PointerEvent,
    ): void => {
      finishPointerDrag(
        event,
      );
    };

  const handleKeyDown =
    (
      event:
        KeyboardEvent,
    ): void => {
      const direction =
        resolveKeyboardDirection(
          event.key,
        );

      if (
        direction
        === null
      ) {
        return;
      }

      event.preventDefault();

      const position =
        initializeExplicitPosition();

      const step =
        event.shiftKey
          ? keyboardStep * 3
          : keyboardStep;

      applyPosition({
        left:
          position.left
          + direction.left * step,

        top:
          position.top
          + direction.top * step,
      });
    };

  options.handle.addEventListener(
    'pointerdown',
    handlePointerDown,
  );

  options.handle.addEventListener(
    'pointermove',
    handlePointerMove,
  );

  options.handle.addEventListener(
    'pointerup',
    handlePointerUp,
  );

  options.handle.addEventListener(
    'pointercancel',
    handlePointerUp,
  );

  options.handle.addEventListener(
    'keydown',
    handleKeyDown,
  );

  return {
    dispose:
      () => {
        options.handle.removeEventListener(
          'pointerdown',
          handlePointerDown,
        );

        options.handle.removeEventListener(
          'pointermove',
          handlePointerMove,
        );

        options.handle.removeEventListener(
          'pointerup',
          handlePointerUp,
        );

        options.handle.removeEventListener(
          'pointercancel',
          handlePointerUp,
        );

        options.handle.removeEventListener(
          'keydown',
          handleKeyDown,
        );
      },
  };
}

function resolveKeyboardDirection(
  key:
    string,
): DraggableWindowPosition | null {
  switch (
    key
  ) {
    case 'ArrowLeft':
      return {
        left:
          -1,

        top:
          0,
      };

    case 'ArrowRight':
      return {
        left:
          1,

        top:
          0,
      };

    case 'ArrowUp':
      return {
        left:
          0,

        top:
          -1,
      };

    case 'ArrowDown':
      return {
        left:
          0,

        top:
          1,
      };

    default:
      return null;
  }
}

function clampNumber(
  value:
    number,

  minimum:
    number,

  maximum:
    number,
): number {
  return Math.min(
    maximum,
    Math.max(
      minimum,
      value,
    ),
  );
}