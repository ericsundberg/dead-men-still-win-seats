import type { SceneContext } from '../../app/scene-router';
import { makeElement } from '../../ui/dom-helpers';
import {
  makeNumberInput,
  makeNumberLabel,
  readWholeNumber,
} from './number-field';

export function makeYearlyCommandForm(context: SceneContext): HTMLFormElement {
  const form = makeElement('form', {
    className: 'menu-form',
  });

  const suggestedCommand = context.game.getSuggestedTurnCommand() ?? {
    acresToBuy: 0,
    acresToSell: 0,
    grainToFeed: 0,
    acresToPlant: 0,
  };

  const acresToBuyInput = makeNumberInput(
    'acres-to-buy',
    suggestedCommand.acresToBuy,
  );
  const acresToSellInput = makeNumberInput(
    'acres-to-sell',
    suggestedCommand.acresToSell,
  );
  const grainToFeedInput = makeNumberInput(
    'grain-to-feed',
    suggestedCommand.grainToFeed,
  );
  const acresToPlantInput = makeNumberInput(
    'acres-to-plant',
    suggestedCommand.acresToPlant,
  );

  form.append(
    makeNumberLabel('Acres to buy', acresToBuyInput),
    makeNumberLabel('Acres to sell', acresToSellInput),
    makeNumberLabel('Grain to feed people', grainToFeedInput),
    makeNumberLabel('Acres to plant', acresToPlantInput),
  );

  const submitButton = document.createElement('button');

  submitButton.type = 'submit';
  submitButton.className = 'menu-button';
  submitButton.textContent = 'Submit Year';

  form.append(submitButton);

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    context.audio.sfx.play('button-click');

    const outcome = context.game.processTurn({
      acresToBuy: readWholeNumber(acresToBuyInput),
      acresToSell: readWholeNumber(acresToSellInput),
      grainToFeed: readWholeNumber(grainToFeedInput),
      acresToPlant: readWholeNumber(acresToPlantInput),
    });

    if (!outcome) {
      console.warn('[game] tried to submit a yearly turn without an active game');
      context.navigate('game-setup');
      return;
    }

    console.log(`[game] processed turn for year ${outcome.previousState.year}`);

    context.navigate('yearly-turn');
  });

  return form;
}
