import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  clampDraggableWindowPosition,
} from './draggable-window';

describe(
  'draggable window',
  () => {
    it(
      'keeps the window inside all configured boundaries',
      () => {
        expect(
          clampDraggableWindowPosition(
            {
              left:
                -100,

              top:
                -50,
            },
            {
              width:
                1_600,

              height:
                900,
            },
            {
              width:
                700,

              height:
                620,
            },
            {
              top:
                100,

              right:
                20,

              bottom:
                70,

              left:
                20,
            },
          ),
        ).toEqual({
          left:
            20,

          top:
            100,
        });

        expect(
          clampDraggableWindowPosition(
            {
              left:
                1_500,

              top:
                850,
            },
            {
              width:
                1_600,

              height:
                900,
            },
            {
              width:
                700,

              height:
                620,
            },
            {
              top:
                100,

              right:
                20,

              bottom:
                70,

              left:
                20,
            },
          ),
        ).toEqual({
          left:
            880,

          top:
            210,
        });
      },
    );

    it(
      'preserves positions already inside the available area',
      () => {
        expect(
          clampDraggableWindowPosition(
            {
              left:
                420,

              top:
                150,
            },
            {
              width:
                1_600,

              height:
                900,
            },
            {
              width:
                700,

              height:
                620,
            },
            {
              top:
                100,

              right:
                20,

              bottom:
                70,

              left:
                20,
            },
          ),
        ).toEqual({
          left:
            420,

          top:
            150,
        });
      },
    );

    it(
      'uses the minimum boundary when the window is oversized',
      () => {
        expect(
          clampDraggableWindowPosition(
            {
              left:
                800,

              top:
                500,
            },
            {
              width:
                600,

              height:
                400,
            },
            {
              width:
                700,

              height:
                500,
            },
            {
              top:
                30,

              right:
                20,

              bottom:
                20,

              left:
                30,
            },
          ),
        ).toEqual({
          left:
            30,

          top:
            30,
        });
      },
    );
  },
);