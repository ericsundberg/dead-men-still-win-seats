import type { CampaignEffects } from '../game/campaign/campaign-effects';

type Digit =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9';

type NonZeroDigit =
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9';

export type EventNumber =
  | `0${NonZeroDigit}`
  | `${NonZeroDigit}${Digit}`;

export type EventId = `event_${string}_${EventNumber}`;
export type EventPackId = `events_${string}`;
export type EventDecisionId = `decision_${string}`;

export type EventTriggerDefinition =
  | {
      readonly type: 'manual';
    }
  | {
      readonly type: 'turn';
      readonly turn: number;
    }
  | {
      readonly type: 'chance';
      readonly chancePercent: number;
    };

export interface EventRequirements {
  readonly minimumCash?: number;
  readonly minimumFavors?: number;
  readonly minimumActionPoints?: number;

  readonly requiredFlags?: readonly string[];
  readonly excludedFlags?: readonly string[];
}

export interface EventNewsItemDefinition {
  readonly headline: string;
  readonly body?: string;
  readonly category?: string;
}

export interface EventDecisionDefinition {
  readonly id: EventDecisionId;
  readonly label: string;

  readonly requirements?: EventRequirements;
  readonly effects?: CampaignEffects;

  readonly addFlags?: readonly string[];
  readonly removeFlags?: readonly string[];

  readonly queueEventIds?: readonly EventId[];
  readonly newsItems?: readonly EventNewsItemDefinition[];
}

export interface GameEventDefinition {
  readonly id: EventId;
  readonly title: string;
  readonly description: string;

  readonly trigger: EventTriggerDefinition;
  readonly requirements?: EventRequirements;
  readonly decisions: readonly EventDecisionDefinition[];

  readonly repeatable?: boolean;
  readonly imagePath?: string;
}

export interface EventPackDefinition {
  readonly eventPackId: EventPackId;
  readonly events: readonly GameEventDefinition[];
}