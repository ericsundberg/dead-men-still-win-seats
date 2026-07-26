import type {
  CampaignEndingFmvId,
} from '../campaign/campaign-ending-fmv';

export type TitleFmvSelectionId =
  | 'intro'
  | CampaignEndingFmvId;

export interface TitleFmvMenuItem {
  readonly id:
    TitleFmvSelectionId;

  readonly label:
    string;
}

export const titleFmvMenuItems:
  readonly TitleFmvMenuItem[] = [
    {
      id:
        'intro',

      label:
        'Intro',
    },

    {
      id:
        'win',

      label:
        'Win Ending',
    },

    {
      id:
        'draw',

      label:
        'Draw Ending',
    },

    {
      id:
        'lose',

      label:
        'Lose Ending',
    },
  ];

export function isCampaignEndingFmvSelection(
  selectionId:
    TitleFmvSelectionId,
): selectionId is CampaignEndingFmvId {
  return (
    selectionId
    !== 'intro'
  );
}
