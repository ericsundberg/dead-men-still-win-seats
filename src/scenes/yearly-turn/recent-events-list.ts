import type { TurnOutcome } from '../../core/types';
import { makeElement } from '../../ui/dom-helpers';

export function makeRecentEventsList(
  lastOutcome: TurnOutcome | null,
): HTMLUListElement {
  const eventList = makeElement('ul', {
    className: 'annual-event-list',
  });

  if (!lastOutcome) {
    eventList.append(
      makeElement('li', {
        textContent: 'No yearly command has been submitted yet.',
      }),
    );

    return eventList;
  }

  for (const event of lastOutcome.events) {
    eventList.append(
      makeElement('li', {
        textContent: event,
      }),
    );
  }

  return eventList;
}
