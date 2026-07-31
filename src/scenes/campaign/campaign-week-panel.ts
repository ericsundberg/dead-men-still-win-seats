import type {
  CampaignState,
} from '../../game/campaign/campaign-state';
import {
  makeElement,
} from '../../ui/dom-helpers';

export interface CampaignWeekPanelModel {
  readonly title:
    string;

  readonly actionPointSummary:
    string;

  readonly instruction:
    string;

  readonly latestHeadline:
    string;
}

/**
 * Converts current campaign state into the weekly briefing shown
 * on the campaign's compact canary legal pad.
 */
export function createCampaignWeekPanelModel(
  campaignState:
    CampaignState,
): CampaignWeekPanelModel {
  const actionPoints =
    campaignState
      .resources
      .actionPoints;

  const actionPointUnit =
    actionPoints === 1
      ? 'action point'
      : 'action points';

  const latestHeadline =
    campaignState.newsFeed[
      campaignState.newsFeed.length
      - 1
    ]
    ?? 'No new campaign headlines this week.';

  return {
    title:
      `Week ${campaignState.currentTurn} Briefing`,

    actionPointSummary:
      `${actionPoints} ${actionPointUnit} remaining.`,

    instruction:
      actionPoints > 0
        ? [
            'Choose any campaign actions you want to take.',
            'End the week using the election countdown when ready.',
          ].join(
            ' ',
          )
        : [
            'The campaign has exhausted its actions for this week.',
            'End the week using the election countdown to continue.',
          ].join(
            ' ',
          ),

    latestHeadline,
  };
}

/**
 * Builds the freestanding weekly campaign memo.
 */
export function makeCampaignWeekPanel(
  campaignState:
    CampaignState,
): HTMLElement {
  const model =
    createCampaignWeekPanelModel(
      campaignState,
    );

  const panel =
    makeElement(
      'section',
      {
        className:
          'campaign-week-panel canary-legal-pad',
      },
    );

  panel.setAttribute(
    'aria-label',
    'Weekly campaign briefing',
  );

  const heading =
    makeElement(
      'h2',
      {
        className:
          'campaign-week-panel-title',

        textContent:
          model.title,
      },
    );

  const actionPointSummary =
    makeElement(
      'p',
      {
        className:
          'campaign-week-action-summary',

        textContent:
          model.actionPointSummary,
      },
    );

  const instructionHeading =
    makeElement(
      'h3',
      {
        className:
          'campaign-week-section-title',

        textContent:
          'This Week',
      },
    );

  const instruction =
    makeElement(
      'p',
      {
        className:
          'campaign-week-instruction',

        textContent:
          model.instruction,
      },
    );

  const headlineSection =
    makeElement(
      'section',
      {
        className:
          'campaign-week-headline',
      },
    );

  const headlineHeading =
    makeElement(
      'h3',
      {
        className:
          'campaign-week-headline-title',

        textContent:
          'Latest Headline',
      },
    );

  const headline =
    makeElement(
      'p',
      {
        className:
          'campaign-week-headline-text',

        textContent:
          model.latestHeadline,
      },
    );

  headlineSection.append(
    headlineHeading,
    headline,
  );

  panel.append(
    heading,
    actionPointSummary,
    instructionHeading,
    instruction,
    headlineSection,
  );

  return panel;
}