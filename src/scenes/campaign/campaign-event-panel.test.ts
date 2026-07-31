import {
  describe,
  expect,
  it,
} from 'vitest';
import type {
  GameEventDefinition,
} from '../../events/event-types';
import {
  createInitialCampaignState,
  type CampaignState,
} from '../../game/campaign/campaign-state';
import {
  createCampaignEventPanelModel,
  formatCampaignEventDecisionFailureReasons,
  resolveCampaignEventImageUrl,
} from './campaign-event-model';

const eventWithImage:
  GameEventDefinition = {
    id:
      'event_panel_01',

    title:
      'The Reporter Arrives',

    description:
      'A reporter waits outside campaign headquarters.',

    imagePath:
      'media/reporter-arrives.webp',

    trigger: {
      type:
        'turn',

      turn:
        1,
    },

    decisions: [
      {
        id:
          'decision_answer',

        label:
          'Answer the question.',
      },

      {
        id:
          'decision_pay',

        label:
          'Offer a discreet payment.',

        requirements: {
          minimumCash:
            200_000,
        },
      },
    ],
  };

function createResolvingState():
  CampaignState {
  return {
    ...createInitialCampaignState(
      'easy',
    ),

    phase:
      'resolving-events',

    activeEventInstanceId:
      eventWithImage.id,
  };
}

describe(
  'campaign event model',
  () => {
    it(
      'resolves event images beneath the public event-art directory',
      () => {
        expect(
          resolveCampaignEventImageUrl(
            'media/reporter-arrives.webp',
            '/dead-men/',
          ),
        ).toBe(
          [
            '/dead-men/',
            'assets/art/events/',
            'media/reporter-arrives.webp',
          ].join(
            '',
          ),
        );
      },
    );

    it(
      'omits the image when no image path is scripted',
      () => {
        expect(
          resolveCampaignEventImageUrl(
            undefined,
            '/',
          ),
        ).toBeNull();
      },
    );

    it(
      'rejects image paths that escape the event-art directory',
      () => {
        expect(
          resolveCampaignEventImageUrl(
            '../portraits/senator.webp',
            '/',
          ),
        ).toBeNull();

        expect(
          resolveCampaignEventImageUrl(
            '/absolute/image.webp',
            '/',
          ),
        ).toBeNull();
      },
    );

    it(
      'creates title, text, image, and decision models',
      () => {
        const model =
          createCampaignEventPanelModel(
            createResolvingState(),
            eventWithImage,
            '/',
          );

        expect(
          model.title,
        ).toBe(
          'The Reporter Arrives',
        );

        expect(
          model.description,
        ).toBe(
          'A reporter waits outside campaign headquarters.',
        );

        expect(
          model.imageUrl,
        ).toBe(
          '/assets/art/events/media/reporter-arrives.webp',
        );

        expect(
          model.decisions,
        ).toEqual([
          {
            id:
              'decision_answer',

            label:
              'Answer the question.',

            disabled:
              false,

            unavailableMessage:
              null,
          },

          {
            id:
              'decision_pay',

            label:
              'Offer a discreet payment.',

            disabled:
              true,

            unavailableMessage:
              'Not enough cash.',
          },
        ]);
      },
    );

    it(
      'formats multiple unavailable reasons',
      () => {
        expect(
          formatCampaignEventDecisionFailureReasons([
            'insufficient-cash',
            'insufficient-favors',
            'missing-required-flags',
          ]),
        ).toBe(
          [
            'Not enough cash.',
            'Not enough favors.',
            'Required campaign conditions have not been met.',
          ].join(
            ' ',
          ),
        );
      },
    );
  },
);